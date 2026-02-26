// File: frontend/skill/api/config.ts
/**
 * Axios configuration with interceptors for JWT authentication
 */
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// In development, default to direct backend URL for reliability.
// Set VITE_USE_DEV_PROXY=true only when you explicitly want /api dev proxy routing.
const RAW_API_URL = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
const DEV_SAFE_API_URL = RAW_API_URL.replace('://localhost', '://127.0.0.1');
const USE_DEV_PROXY = import.meta.env.DEV && import.meta.env.VITE_USE_DEV_PROXY === 'true';
const BASE_URL = USE_DEV_PROXY
  ? ''
  : (import.meta.env.DEV ? (DEV_SAFE_API_URL || 'http://127.0.0.1:8000') : RAW_API_URL);
const DEV_DIRECT_FALLBACK_URL = (DEV_SAFE_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
const DEFAULT_TIMEOUT_MS = 30000;
const REFRESH_TIMEOUT_MS = 15000;
const AUTH_BYPASS_REFRESH_PATHS = [
  '/api/accounts/login/',
  '/api/accounts/register/',
  '/api/accounts/refresh/',
  '/api/accounts/verify-email/',
  '/api/accounts/resend-verification/',
  '/api/accounts/forgot-password/',
  '/api/accounts/reset-password/',
];

/**
 * Create axios instance with base configuration
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

const getRequestTargetLabel = (): string => {
  if (BASE_URL) return BASE_URL;
  return import.meta.env.DEV ? 'dev proxy (/api)' : 'same-origin /api';
};

const isApiPath = (url?: string): boolean => typeof url === 'string' && url.startsWith('/api/');
const shouldBypassRefreshForPath = (url?: string): boolean =>
  typeof url === 'string' && AUTH_BYPASS_REFRESH_PATHS.some((path) => url.startsWith(path));

/**
 * Request interceptor - Adds JWT token to all requests and sets Content-Type
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Set Content-Type based on data type
    // Let FormData set its own Content-Type with boundary
    if (!(config.data instanceof FormData)) {
      // For non-FormData requests, set JSON content type
      if (config.headers && !config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
      }
    } else {
      // For FormData, delete Content-Type to let axios/browser set it with boundary
      if (config.headers && config.headers['Content-Type']) {
        delete config.headers['Content-Type'];
      }
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handles 401 errors and token refresh
 */
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;
    const requestUrl: string | undefined = originalRequest?.url;

    // Network fallback: if direct URL fails in dev, retry once via same-origin proxy.
    if (
      import.meta.env.DEV &&
      !USE_DEV_PROXY &&
      !error.response &&
      originalRequest &&
      !originalRequest._proxyRetry &&
      isApiPath(requestUrl)
    ) {
      originalRequest._proxyRetry = true;
      try {
        return await apiClient.request({
          ...originalRequest,
          baseURL: '',
          timeout: originalRequest.timeout || DEFAULT_TIMEOUT_MS,
        });
      } catch (retryError) {
        return Promise.reject(retryError);
      }
    }

    // Network fallback: if proxy fails in dev, retry once via direct backend URL.
    if (
      import.meta.env.DEV &&
      USE_DEV_PROXY &&
      !error.response &&
      originalRequest &&
      !originalRequest._directRetry &&
      isApiPath(requestUrl)
    ) {
      originalRequest._directRetry = true;
      try {
        return await apiClient.request({
          ...originalRequest,
          baseURL: DEV_DIRECT_FALLBACK_URL,
          timeout: originalRequest.timeout || DEFAULT_TIMEOUT_MS,
        });
      } catch (retryError) {
        return Promise.reject(retryError);
      }
    }
    
    // Handle 401 Unauthorized errors
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !shouldBypassRefreshForPath(requestUrl)
    ) {
      if (isRefreshing) {
        // Queue requests while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            if (token && originalRequest.headers) {
              originalRequest.headers['Authorization'] = 'Bearer ' + token;
            }
            return apiClient(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        // No refresh token - logout user
        handleLogout();
        return Promise.reject(error);
      }
      
      try {
        // Attempt to refresh the token
        let response;
        const refreshPayload = { refresh: refreshToken };
        const refreshPath = '/api/accounts/refresh/';

        try {
          response = await axios.post(`${BASE_URL}${refreshPath}`, refreshPayload, {
            timeout: REFRESH_TIMEOUT_MS,
          });
        } catch (refreshRequestError: any) {
          if (
            import.meta.env.DEV &&
            USE_DEV_PROXY &&
            !refreshRequestError?.response
          ) {
            response = await axios.post(
              `${DEV_DIRECT_FALLBACK_URL}${refreshPath}`,
              refreshPayload,
              { timeout: REFRESH_TIMEOUT_MS }
            );
          } else {
            throw refreshRequestError;
          }
        }
        
        const { access } = response.data;
        
        // Update stored token
        localStorage.setItem('token', access);
        
        // Update Authorization header
        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${access}`;
        }
        
        processQueue(null, access);
        isRefreshing = false;
        
        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        handleLogout();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

/**
 * Logout helper function
 * Note: Do NOT redirect here - let the app handle navigation
 */
const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_data');
  
  // DO NOT use window.location.href - it causes full page reloads
  // The app will handle showing the login page when user state becomes null
};

/**
 * Error handler utility
 */
export const handleApiError = (error: any): string => {
  if (error.response) {
    // Server responded with error
    const { data, status } = error.response;
    
    if (status === 400) {
      // Validation errors
      if (typeof data === 'object') {
        // Check for specific error messages
        if (data.detail) {
          return data.detail;
        }
        if (data.message) {
          return data.message;
        }
        // Handle field-level errors
        const firstError = Object.values(data)[0];
        return Array.isArray(firstError) ? firstError[0] : String(firstError);
      }
      return data?.detail || 'Invalid request. Please check your information.';
    } else if (status === 401) {
      // Check for specific authentication error messages
      if (data?.detail) {
        return data.detail;
      }
      return 'Invalid email or password. Please try again.';
    } else if (status === 403) {
      return 'You do not have permission to perform this action.';
    } else if (status === 404) {
      return 'Resource not found.';
    } else if (status === 500) {
      return 'Server error. Please try again later.';
    }
    
    return data?.detail || data?.message || 'An error occurred';
  } else if (error.request) {
    // Request made but no response
    const target = getRequestTargetLabel();
    if (error.code === 'ECONNABORTED') {
      return `Request timed out while connecting to ${target}.`;
    }
    return `Network error while connecting to ${target}.`;
  } else {
    // Error in request configuration
    return error.message || 'An unexpected error occurred';
  }
};

export default apiClient;
