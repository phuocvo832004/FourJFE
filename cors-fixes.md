# Phân tích và sửa lỗi CORS với Auth0

## Vấn đề
Lỗi CORS xảy ra khi hệ thống cố gắng gọi API Auth0 trực tiếp từ frontend thay vì sử dụng SDK Auth0-React. Từ báo lỗi, có vẻ như redirect_uri đang trỏ tới `/api/carts/` thay vì `window.location.origin` như đã cấu hình trong Auth0Provider.

## Các hành động đã thực hiện
1. Đã tạo trang CallbackPage riêng biệt để xử lý callback Auth0:
   ```jsx
   // src/pages/CallbackPage.tsx
   import { useEffect } from 'react';
   import { useAuth0 } from '@auth0/auth0-react';
   import { useNavigate } from 'react-router-dom';

   const CallbackPage = () => {
     const { isLoading, isAuthenticated } = useAuth0();
     const navigate = useNavigate();

     useEffect(() => {
       if (!isLoading && isAuthenticated) {
         navigate('/');
       }
     }, [isLoading, isAuthenticated, navigate]);

     return <div className="flex justify-center items-center h-screen">Đang xử lý đăng nhập...</div>;
   };

   export default CallbackPage;
   ```

2. Đã cập nhật route trong App.tsx:
   ```jsx
   <Route path="callback" element={<CallbackPage />} />
   ```

## Phân tích vấn đề

### Triệu chứng:
- Lỗi CORS với Auth0
- Redirect URI là `/api/carts/` (không phải origin thực tế)

### Nguyên nhân có thể:
1. Có gọi API trực tiếp đến Auth0 từ endpoints `/api/carts/`
2. Có một custom fetch/axios request đang gửi yêu cầu đến Auth0 mà không dùng SDK
3. Có thể có interceptor bị lỗi trong apiClient.ts khi làm việc với API cart

### Phân tích mã nguồn:
1. **apiClient.ts**: Không có gọi trực tiếp đến Auth0, nhưng có hàm `triggerLogout()` có thể đang gây vấn đề
2. **useCart.ts**: Có sử dụng `getToken()` nhưng không gọi trực tiếp Auth0
3. **cartApi.ts**: Sử dụng apiClient, không gọi trực tiếp Auth0

## Giải pháp cần thực hiện tiếp theo

### 1. Cập nhật Authorization trong apiClient 
Có thể lỗi xảy ra khi apiClient gửi request đến `/api/carts` với header Authorization chưa đúng:

```js
// src/api/apiClient.ts - Cập nhật phần interceptor
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const isPublic = isPublicApi(config.url || '');

  if (!isPublic) {
    try {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // Không redirect nếu đang ở login hoặc callback
        if (!['/login', '/callback'].includes(window.location.pathname)) {
          console.warn(`Token unavailable for non-public API request: ${config.url}`);
          triggerLogout();
          return Promise.reject(new Error("Authentication token not available."));
        }
      }
    } catch (error) {
      console.error("Error setting token in request interceptor:", error);
    }
  }

  return config;
}, error => Promise.reject(error));
```

### 2. Kiểm tra Auth0Provider trong main.tsx
Đảm bảo config Auth0Provider là chính xác:

```jsx
<Auth0Provider
  domain={auth0Domain}
  clientId={auth0ClientId}
  authorizationParams={{
    redirect_uri: window.location.origin,
    audience: auth0Audience,
    scope: "openid profile email offline_access"
  }}
  cacheLocation="localstorage"
>
  <App />
</Auth0Provider>
```

### 3. Cập nhật hàm getToken trong setupApiClient.ts
Đảm bảo hàm getToken xử lý lỗi khi token hết hạn:

```js
export const getToken = async (): Promise<string | null> => {
  if (getAccessTokenSilently) {
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE || 'http://localhost:80',
        },
        cacheMode: "on-demand" // Force refresh token when needed
      });
      return token;
    } catch (error) {
      console.error("Error getting access token:", error);
      const authError = error as OAuthError;
      if (
        authError.error === 'login_required' || 
        authError.error === 'consent_required'
      ) {
        if (logout && !['/login', '/callback'].includes(window.location.pathname)) {
          logout({ logoutParams: { returnTo: window.location.origin } });
        }
      }
      return null;
    }
  }
  return null;
};
```

## Khuyến nghị bổ sung
1. Kiểm tra cấu hình Auth0 trên dashboard Auth0: Đảm bảo đã cấu hình Allowed Callback URLs, Allowed Logout URLs và Allowed Web Origins đều bao gồm domain của ứng dụng.
2. Kiểm tra Network tab trên browser để xem chính xác yêu cầu nào đang gây lỗi CORS.
