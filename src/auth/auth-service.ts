import { useAuth0 } from '@auth0/auth0-react';
import { useCallback } from 'react';

// Hook tập trung để quản lý mọi tương tác xác thực trong ứng dụng
export const useAuthService = () => {
  const {
    isAuthenticated,
    isLoading,
    user,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently
  } = useAuth0();

  // Hàm đăng nhập được chuẩn hóa
  const login = useCallback(() => {
    return loginWithRedirect({
      appState: { returnTo: window.location.pathname }
    });
  }, [loginWithRedirect]);

  // Hàm đăng xuất được chuẩn hóa
  const logout = useCallback(() => {
    return auth0Logout({
      logoutParams: { returnTo: window.location.origin }
    });
  }, [auth0Logout]);

  // Hàm lấy token được bọc lại với xử lý lỗi
  const getToken = useCallback(async () => {
    if (!isAuthenticated) {
      return null;
    }

    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE || 'http://localhost:80'
        }
      });
      return token;
    } catch (error) {
      console.error('Lỗi khi lấy token:', error);
      return null;
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  // Kiểm tra role của người dùng
  const hasRole = useCallback((role: string) => {
    if (!isAuthenticated || !user) return false;
    
    const namespace = 'https://myapp.example.com';
    const roles = user[`${namespace}roles`] as string[] | undefined;
    
    return roles?.includes(role.toUpperCase()) || false;
  }, [isAuthenticated, user]);

  return {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    getToken,
    hasRole
  };
};

// Singleton instance cho các helpers functions không dùng hooks
let _getTokenSilently: ReturnType<typeof useAuth0>['getAccessTokenSilently'] | null = null;
let _logout: ReturnType<typeof useAuth0>['logout'] | null = null;

// Setup function được gọi từ App.tsx
export const setupAuthService = (
  getTokenSilently: ReturnType<typeof useAuth0>['getAccessTokenSilently'],
  logout: ReturnType<typeof useAuth0>['logout']
) => {
  _getTokenSilently = getTokenSilently;
  _logout = logout;
};

// Helper function cho các services không dùng hooks
export const getTokenSilently = async (): Promise<string | null> => {
  if (!_getTokenSilently) return null;
  
  try {
    return await _getTokenSilently({
      authorizationParams: {
        audience: import.meta.env.VITE_AUTH0_AUDIENCE || 'http://localhost:80'
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy token từ helper:', error);
    return null;
  }
};

// Helper function để logout từ services không dùng hooks
export const logoutUser = () => {
  if (!_logout) return;
  
  _logout({
    logoutParams: { returnTo: window.location.origin }
  });
}; 