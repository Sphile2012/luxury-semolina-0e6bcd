import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, tokenStore } from '@/api/phumeClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings] = useState(false); // always false — no cloud service
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings] = useState({ id: 'panic-ring', public_settings: {} });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setIsLoadingAuth(true);
    setAuthError(null);

    const token = tokenStore.get();
    if (!token) {
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      return;
    }

    try {
      const currentUser = await auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Auth check failed:', error);
      tokenStore.clear();
      setIsAuthenticated(false);
      if (error.status === 401 || error.status === 403) {
        setAuthError({ type: 'auth_required', message: 'Session expired. Please log in again.' });
      }
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const login = async (email, password) => {
    const result = await auth.login(email, password);
    tokenStore.set(result.token);
    setUser(result.user);
    setIsAuthenticated(true);
    setAuthError(null);
    return result;
  };

  const register = async (email, password, full_name) => {
    const result = await auth.register(email, password, full_name);
    tokenStore.set(result.token);
    setUser(result.user);
    setIsAuthenticated(true);
    setAuthError(null);
    return result;
  };

  const logout = () => {
    tokenStore.clear();
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/Login';
  };

  const navigateToLogin = () => {
    window.location.href = '/Login';
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      login,
      register,
      logout,
      navigateToLogin,
      checkAppState: checkAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
