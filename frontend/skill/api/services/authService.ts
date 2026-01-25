
import apiClient, { handleApiError } from '../config';
import {
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  TokenRefreshRequest,
  TokenRefreshResponse
} from '../types';

class AuthService {
  /**
   * Login user with email and password
   * POST /api/accounts/login/
   */
  async login(credentials: LoginRequest): Promise<User> {
    try {
      const response = await apiClient.post<LoginResponse>(
        '/api/accounts/login/',
        credentials
      );
      
      const { access, refresh, user } = response.data;
      
      // Store tokens and user data
      localStorage.setItem('token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user_data', JSON.stringify({ ...user, token: access }));
      
      return { ...user, token: access };
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Register new user
   * POST /api/accounts/register/
   */
  async register(data: RegisterRequest): Promise<User> {
    try {
      const response = await apiClient.post<User>(
        '/api/accounts/register/',
        data
      );
      
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Refresh access token
   * POST /api/accounts/refresh/
   */
  async refreshToken(refreshToken: string): Promise<string> {
    try {
      const response = await apiClient.post<TokenRefreshResponse>(
        '/api/accounts/refresh/',
        { refresh: refreshToken }
      );
      
      const { access } = response.data;
      
      // Update stored token
      localStorage.setItem('token', access);
      
      return access;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get current user profile
   * GET /api/accounts/me/
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<User>('/api/accounts/me/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update user profile
   * PATCH /api/accounts/profile/
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      // Handle avatar upload if present
      const formData = new FormData();
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'avatar' && typeof value === 'string' && value.startsWith('blob:')) {
            // Convert blob URL to file if needed
            // For now, skip blob URLs
            return;
          }
          formData.append(key, value as string);
        }
      });
      
      const response = await apiClient.patch<User>(
        '/api/accounts/profile/',
        data.avatar ? formData : data,
        data.avatar ? {
          headers: { 'Content-Type': 'multipart/form-data' }
        } : undefined
      );
      
      // Update stored user data
      const currentUser = JSON.parse(localStorage.getItem('user_data') || '{}');
      const updatedUser = { ...currentUser, ...response.data };
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
      
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Verify email with token
   * POST /api/accounts/verify-email/
   */
  async verifyEmail(token: string): Promise<{ message: string; user: User }> {
    try {
      const response = await apiClient.post<{ message: string; user: User }>(
        '/api/accounts/verify-email/',
        { token }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Resend verification email
   * POST /api/accounts/resend-verification/
   */
  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>(
        '/api/accounts/resend-verification/',
        { email }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Logout user (clear local storage)
   */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  /**
   * Get stored user data
   */
  getStoredUser(): User | null {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }
}

export default new AuthService();