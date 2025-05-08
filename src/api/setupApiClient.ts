// import { apiClient } from './apiClient'; // Not needed here
import { GetTokenSilentlyOptions, LogoutOptions, OAuthError, User } from '@auth0/auth0-react';

// Type for the function passed from useAuth0
type GetTokenSilentlyType = (options?: GetTokenSilentlyOptions) => Promise<string>;
type LogoutType = (options?: LogoutOptions) => void;

let getAccessTokenSilently: GetTokenSilentlyType | null = null;
let logout: LogoutType | null = null;
let currentUser: User | undefined = undefined; // Biến để lưu trữ thông tin user

// Thêm biến để kiểm soát việc gọi liên tục
let tokenRequestInProgress = false;
let lastTokenError: string | null = null;
let tokenErrorCount = 0;
const MAX_ERROR_COUNT = 3;
const ERROR_RESET_TIMEOUT = 10000; // 10 giây

// Function to be called from App component or similar
export const setupAuthInterceptor = (
    tokenGetter: GetTokenSilentlyType,
    logoutHandler: LogoutType,
    userObject?: User // Thêm tham số userObject
) => {
    getAccessTokenSilently = tokenGetter;
    logout = logoutHandler;
    currentUser = userObject; // Lưu userObject
};

// Function to get the current user's ID (sub claim)
export const getCurrentUserId = (): string | null => {
    return currentUser?.sub || null;
};

// Function to get the token (used inside the interceptor)
export const getToken = async (): Promise<string | null> => {
    // Kiểm tra nếu đang có yêu cầu token đang xử lý hoặc đã vượt quá giới hạn lỗi
    if (tokenRequestInProgress) {
        console.log("[setupApiClient] Token request already in progress, waiting...");
        await new Promise(resolve => setTimeout(resolve, 500));
        return getToken(); // Thử lại sau 500ms
    }
    
    if (tokenErrorCount >= MAX_ERROR_COUNT) {
        const now = new Date().getTime();
        if (!lastTokenError || (now - parseInt(lastTokenError)) < ERROR_RESET_TIMEOUT) {
            console.warn(`[setupApiClient] Too many token errors (${tokenErrorCount}), waiting before retrying.`);
            return null;
        } else {
            // Reset counter sau khoảng thời gian chờ
            tokenErrorCount = 0;
        }
    }

    if (getAccessTokenSilently) {
        try {
            tokenRequestInProgress = true;
            
            // Lấy giá trị redirect_uri một cách an toàn
            let redirectUriForAuth0: string;

            if (typeof window !== 'undefined') {
                // Do cấu hình Kong OIDC yêu cầu redirect_uri là 'http://localhost:5173/callback',
                // và việc sử dụng `${window.location.origin}/callback` trước đó dẫn đến giá trị không chính xác
                // (ví dụ: http://localhosthttp://localhost:5173/callback),
                // chúng ta sẽ đặt trực tiếp giá trị đúng cho redirectUriForAuth0.
                redirectUriForAuth0 = 'http://localhost:5173/callback';
            } else {
                // Điều này không nên xảy ra trong ngữ cảnh client-side khi gọi getAccessTokenSilently.
                console.error("[setupApiClient] window is not defined. Cannot determine redirect_uri for Auth0.");
                tokenRequestInProgress = false;
                return null;
            }

            console.log(`[setupApiClient] Using redirect_uri for getAccessTokenSilently: ${redirectUriForAuth0}`);

            const token = await getAccessTokenSilently({
                authorizationParams: {
                    audience: import.meta.env.VITE_AUTH0_AUDIENCE || 'http://localhost:80',
                    redirect_uri: redirectUriForAuth0,
                },
                cacheMode: "on"
            });
            
            // Reset các biến kiểm soát lỗi khi thành công
            tokenErrorCount = 0;
            lastTokenError = null;
            tokenRequestInProgress = false;
            
            return token;
        } catch (error) {
            console.error("[setupApiClient] Error getting access token. Full error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
            const authError = error as OAuthError;
            console.error(`[setupApiClient] Auth0 Error type: ${authError.error}, Message: ${authError.message}, Error Description: ${authError.error_description}`);
            
            tokenErrorCount++;
            lastTokenError = String(new Date().getTime());
            tokenRequestInProgress = false;
            
            if (authError.error === 'login_required' || authError.error === 'consent_required') {
                if (logout && !['/login', '/callback'].includes(window.location.pathname)) {
                    console.warn("[setupApiClient] Triggering logout due to login_required or consent_required.");
                    logout({ logoutParams: { returnTo: window.location.origin } });
                }
            } else {
                console.warn("[setupApiClient] Non-login/consent Auth0 error occurred. Token will be null. Error:", authError.error);
            }
            return null;
        }
    }
    console.warn("[setupApiClient] getAccessTokenSilently function is not available.");
    return null;
};

// Function to trigger logout (used inside the interceptor)
export const triggerLogout = () => {
    // Không logout nếu đang ở login hoặc callback
    if (logout && !['/login', '/callback'].includes(window.location.pathname)) {
       console.warn("Triggering logout due to API error or token issue.");
       logout({ logoutParams: { returnTo: window.location.origin } });
    }
} 