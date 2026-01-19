// File: frontend/skill/api/config.ts
/**
 * Axios configuration with interceptors for JWT authentication
 */
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Base API URL - use environment variable in production
const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

/**
 * Create axios instance with base configuration
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

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
    
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue requests while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
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
        const response = await axios.post(`${BASE_URL}/api/accounts/refresh/`, {
          refresh: refreshToken
        });
        
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
 */
const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_data');
  
  // Redirect to login page
  window.location.href = '/';
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
    return 'Network error. Please check your connection.';
  } else {
    // Error in request configuration
    return error.message || 'An unexpected error occurred';
  }
};

export default apiClient;