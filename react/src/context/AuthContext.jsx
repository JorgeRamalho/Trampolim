import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => api.getUser());
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const data = await api.login(email, password);
      api.setToken(data.token);
      api.setUser(data.user);
      setUser(data.user);
      return data;
    } finally { setLoading(false); }
  }, []);

  const register = useCallback(async (name, email, password, phone) => {
    setLoading(true);
    try {
      const data = await api.register(name, email, password, phone);
      api.setToken(data.token);
      api.setUser(data.user);
      setUser(data.user);
      return data;
    } finally { setLoading(false); }
  }, []);

  const logout = useCallback(() => {
    api.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
