import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../api/services';
import { User } from '../api/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (userData: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initialize authentication state on mount
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (token) {
          // Check if token is still valid by fetching current user
          try {
            const userData = await authService.getCurrentUser();
            setUser({ ...userData, token });
          } catch (error) {
            // Token is invalid or expired
            console.error('Auth initialization failed:', error);
            handleLogout();
          }
        }
        // Note: Don't restore user from localStorage without a valid token
        // This prevents stale data from keeping users "logged in"
      } catch (error) {
        console.error('Auth initialization error:', error);
        setError('Failed to initialize authentication');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Login handler - updates context state
   */
  const login = (userData: User) => {
    setUser(userData);
    setError(null);
    
    // Ensure token is stored
    if (userData.token) {
      localStorage.setItem('token', userData.token);
    }
    localStorage.setItem('user_data', JSON.stringify(userData));
  };

  /**
   * Logout handler - clears context and storage
   */
  const logout = () => {
    handleLogout();
  };

  const handleLogout = () => {
    setUser(null);
    setError(null);
    authService.logout();
  };

  /**
   * Update user data in context
   */
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
    }
  };

  /**
   * Refresh user data from server
   */
  const refreshUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser({ ...userData, token: user?.token });
      localStorage.setItem('user_data', JSON.stringify({ ...userData, token: user?.token }));
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setError('Failed to refresh user data');
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    logout,
    updateUser,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to access authentication context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;