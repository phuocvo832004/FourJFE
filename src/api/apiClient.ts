import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
// import authApi from './authApi'; // Remove import if not used elsewhere
import { getToken, triggerLogout, getCurrentUserId } from './setupApiClient'; // Import getCurrentUserId

// Function to get a cookie by name
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') { // Guard for SSR or non-browser environments
    return null;
  }
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return match[2];
  return null;
}

// Hàm để fetch CSRF token từ server
async function fetchCSRFToken(): Promise<string | null> {
  try {
    // Gọi endpoint CSRF của Laravel Sanctum để nhận token
    const API_URL = import.meta.env.VITE_API_URL || '';
    
    // Sửa: Kiểm tra nếu API_URL đã chứa '/api' thì không thêm nữa
    const sanctumEndpoint = API_URL.endsWith('/api') 
      ? `${API_URL}/sanctum/csrf-cookie` 
      : `${API_URL}/api/sanctum/csrf-cookie`;
    
    await axios.get(sanctumEndpoint, { 
      withCredentials: true,
      withXSRFToken: true
    });
    
    return getCookie('XSRF-TOKEN');
  } catch (error) {
    console.error('Lỗi khi lấy CSRF token:', error);
    return null;
  }
}

const API_URL = import.meta.env.VITE_API_URL || '';
// Sửa: Đảm bảo không có API_VERSION nếu API_URL đã có '/api'
const API_VERSION = API_URL.endsWith('/api') ? '' : (import.meta.env.VITE_API_VERSION || '/api');

// API công khai không cần token - Có thể giữ lại hoặc điều chỉnh nếu cần
const PUBLIC_API_PATHS = [
  '/products',
  '/categories',
  '/search/products',
  '/search/suggestions',

];


// Cache logic can remain if needed for performance
const apiCache = new Map<string, {
  data: unknown;
  timestamp: number;
  expiresIn: number; // Consider how long cache should live
}>();
const pendingRequestsMap = new Map<string, Promise<AxiosResponse<unknown>>>();
const DEFAULT_CACHE_TIME = 5 * 60 * 1000; // Example cache time

const getCacheKey = (config: AxiosRequestConfig | InternalAxiosRequestConfig): string => {
  const { url, method, params, data } = config;
  return `${method || 'GET'}_${url}_${JSON.stringify(params || {})}_${JSON.stringify(data || {})}`;
};

const isCacheExpired = (entry: { timestamp: number; expiresIn: number }): boolean => {
  return Date.now() > entry.timestamp + entry.expiresIn;
};


const isPublicApi = (url: string): boolean => {
  if (!url) return false;
  const basePath = url.split('?')[0];
   // Keep logic for specific paths like orders if needed
  if (basePath.includes('/orders/')) {
     return false;
  }
  return PUBLIC_API_PATHS.some(path => {
    return (basePath === path || basePath.startsWith(`${path}/`));
  });
};

interface ExtendedAxiosInstance extends ReturnType<typeof axios.create> {
  clearCache: () => void;
  clearCacheByPattern: (urlPattern: string) => void;
}

// apiClient setup remains mostly the same
const apiClient = axios.create({ // Loại bỏ export để thay thế bằng default export
  baseURL: `${API_URL}${API_VERSION}`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
  withCredentials: true,
  withXSRFToken: true
}) as ExtendedAxiosInstance;

// Request interceptor - Updated to use getToken, XSRF token, and User ID header
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const isPublic = isPublicApi(config.url || '');

  if (!isPublic) {
    try {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        if (!['/login', '/callback'].includes(window.location.pathname)) {
          console.warn(`Token unavailable for non-public API request: ${config.url}`);
          triggerLogout();
          return Promise.reject(new Error("Authentication token not available. Please log in."));
        }
      }
      
      // Thêm User ID vào header nếu có
      const userId = getCurrentUserId();
      if (userId) {
        // QUAN TRỌNG: Thay thế 'X-User-ID' bằng tên header thực tế mà backend của bạn mong đợi
        config.headers['X-User-ID'] = userId;
      } else {
         // Không log lỗi ở đây nếu user không có sẵn, vì có thể là request public đầu tiên trước khi user được load
         // console.warn(`User ID not available for request: ${config.url}`);
      }

    } catch (error) {
      console.error("Error setting auth headers in request interceptor:", error);
      if (!['/login', '/callback'].includes(window.location.pathname)) {
        return Promise.reject(error);
      }
    }
  }

  // Add XSRF token for non-GET/HEAD/OPTIONS requests
  const method = config.method?.toUpperCase();
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    let xsrfToken = getCookie('XSRF-TOKEN');
    
    // Chỉ tìm XSRF token cho API delete cart
    const isDeleteCartRequest = method === 'DELETE' && config.url?.includes('/carts/');
    if (!xsrfToken && isDeleteCartRequest) {
      console.log(`XSRF-TOKEN không tìm thấy, đang cố gắng lấy cho: ${method} ${config.url}`);
      xsrfToken = await fetchCSRFToken();
    }
    
    if (xsrfToken) {
      config.headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken); // Đảm bảo token đã được decode đúng cách
    } else if (isDeleteCartRequest) {
      console.warn(`XSRF-TOKEN cookie không tìm thấy cho request: ${method} ${config.url}`);
    }
  }

  return config;
}, error => Promise.reject(error));


// Response interceptor - Simplified 401 handling
apiClient.interceptors.response.use(response => {
  // Cache successful responses if cache logic is kept
  const cacheKey = getCacheKey(response.config);
  if (response.config.method === 'get' && !isPublicApi(response.config.url || '')) { // Only cache GET for non-public? Adjust as needed
     apiCache.set(cacheKey, {
       data: response.data,
       timestamp: Date.now(),
       expiresIn: DEFAULT_CACHE_TIME
     });
  }
  pendingRequestsMap.delete(cacheKey); // Clear pending request on success
  return response;

}, async error => {
  if (error.response) {
    const { status, config } = error.response;
     const cacheKey = getCacheKey(config);
     pendingRequestsMap.delete(cacheKey); // Clear pending request on error

    // Handle 401 Unauthorized: Trigger logout
    if (status === 401 && !isPublicApi(config.url || '')) {
      console.error(`Unauthorized (401) access to ${config.url}. Logging out.`);
      // Avoid triggering logout for auth endpoints themselves if they fail
      if (
        !['/login', '/callback'].includes(window.location.pathname) && 
        !config.url?.includes('/auth/') && 
        !config.url?.includes('/oauth/')
      ) {
        // Chỉ logout nếu không đang ở trang login hoặc callback
        triggerLogout(); // Use the imported triggerLogout (sync)
        return Promise.reject(new Error("Session expired or invalid. Redirecting to login."));
      }
    }
  }

  return Promise.reject(error);
});


// --- Caching Logic (Keep if desired) ---

apiClient.clearCache = () => {
  apiCache.clear();
};

apiClient.clearCacheByPattern = (urlPattern: string) => {
  for (const key of apiCache.keys()) {
    if (key.includes(urlPattern)) {
      apiCache.delete(key);
    }
  }
};

const originalGet = apiClient.get;

const cachedGet = async <T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  const fullConfig = { ...config, url, method: 'get' };
  const cacheKey = getCacheKey(fullConfig);

  if (pendingRequestsMap.has(cacheKey)) {
    return pendingRequestsMap.get(cacheKey) as Promise<AxiosResponse<T>>;
  }

  // Only check cache for GET requests intended to be cached (e.g., non-public GETs)
  if (!isPublicApi(url)) {
      const cachedResponse = apiCache.get(cacheKey);
      if (cachedResponse && !isCacheExpired(cachedResponse)) {
        console.log(`[Cache Hit] GET ${url}`);
        const response = {
          data: cachedResponse.data,
          status: 200,
          statusText: 'OK (from cache)',
          headers: {},
          config: fullConfig
        } as AxiosResponse<T>;
        return response;
      }
      console.log(`[Cache Miss] GET ${url}`);
  }


  const requestPromise = originalGet<T>(url, config).then(response => {
     // Caching is now handled in the response interceptor's success path
     pendingRequestsMap.delete(cacheKey);
     return response;
  }).catch(error => {
     pendingRequestsMap.delete(cacheKey);
     return Promise.reject(error);
  });

  pendingRequestsMap.set(cacheKey, requestPromise as Promise<AxiosResponse<unknown>>);
  return requestPromise;
};

// Override apiClient.get only if caching is kept
// apiClient.get = cachedGet; // Removed override due to type complexity

// Instead, export cachedGet if needed elsewhere
export { cachedGet };

// --- End Caching Logic ---


// Thêm default export để tương thích với index.ts
export default apiClient;