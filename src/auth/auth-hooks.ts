import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState, useCallback } from 'react';
import { getToken } from '../api/setupApiClient';

/**
 * Compatibility adapter for older code that uses useAuth
 * This provides backward compatibility while transitioning to Auth0
 */
export function useAuth() {
  const {
    isAuthenticated,
    isLoading,
    user,
    loginWithRedirect,
    logout: auth0Logout
  } = useAuth0();

  const [token, setToken] = useState<string | null>(null);
  const [isTokenLoading, setIsTokenLoading] = useState<boolean>(false);
  const [lastTokenFetch, setLastTokenFetch] = useState<number>(0);
  
  // Sử dụng useCallback để tránh tạo lại hàm fetchToken mỗi lần render
  const fetchToken = useCallback(async (force = false) => {
    // Chỉ tìm nạp token nếu người dùng đã xác thực và không có token hoặc lấy mới
    if (!isAuthenticated || isTokenLoading) return;
    
    const now = Date.now();
    // Chỉ lấy token mới nếu bắt buộc hoặc sau 5 phút
    if (!force && token && now - lastTokenFetch < 5 * 60 * 1000) return;
    
    try {
      setIsTokenLoading(true);
      // Use getToken from setupApiClient to ensure audience is set correctly
      const accessToken = await getToken();
      setToken(accessToken);
      setLastTokenFetch(now);
    } catch (error) {
      console.error('Error fetching token:', error);
      setToken(null);
    } finally {
      setIsTokenLoading(false);
    }
  }, [isAuthenticated, isTokenLoading, token, lastTokenFetch]);
  
  useEffect(() => {
    if (isAuthenticated && !token) {
      fetchToken(true); // Chỉ lấy token khi xác thực và chưa có token
    } else if (!isAuthenticated && token) {
      setToken(null); // Xoá token khi đăng xuất
    }
  }, [isAuthenticated, token, fetchToken]);

  // Map old API to new Auth0 API
  const hasRole = (role: string): boolean => {
    // Replace 'https://your-namespace/roles' with your actual custom claim namespace
    const roles = user?.[`${import.meta.env.VITE_AUTH0_NAMESPACE}/roles`] as string[];
    // Corrected precedence for && and ?? operators
    return !!(isAuthenticated && roles?.includes(role));
  };

  // Hàm getToken tối ưu để sử dụng token cache và chỉ gọi API khi cần
  const getTokenOptimized = useCallback(async (): Promise<string | null> => {
    if (token) return token;
    await fetchToken(true);
    return token;
  }, [token, fetchToken]);

  return {
    isAuthenticated,
    isLoading: isLoading || isTokenLoading,
    user,
    token,
    login: loginWithRedirect,
    logout: () => auth0Logout({ logoutParams: { returnTo: window.location.origin } }),
    getToken: getTokenOptimized,
    hasRole
  };
} 