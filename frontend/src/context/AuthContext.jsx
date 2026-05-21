import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        console.log('[AuthContext] Loaded persisted session:', savedUser);
      }
    } catch (e) {
      console.error('[AuthContext] Error loading persisted session:', e);
    }
    setLoading(false);
  }, []);

  const login = (userData, jwtToken) => {
    console.log('[AuthContext] login called with user:', userData);
    localStorage.setItem('token', jwtToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
  };

  const logout = () => {
    console.log('[AuthContext] logout called');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const getCurrentUser = () => {
    if (user) return user;
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  };

  const isAuthenticated = () => {
    const hasToken = !!(token || localStorage.getItem('token'));
    console.log('[AuthContext] isAuthenticated checked:', hasToken);
    return hasToken;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      role: user?.role || null, 
      loading, 
      login, 
      logout,
      getCurrentUser,
      isAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  );
}
