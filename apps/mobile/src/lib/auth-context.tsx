import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem('token');
      if (t) {
        setToken(t);
        try {
          const u = await api.getMe();
          setUser({ userId: u.id, account: u.account, nickname: u.nickname, avatarUrl: u.avatarUrl, userCode: u.userCode });
        } catch {
          await AsyncStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = async (account, password) => {
    const res = await api.login(account, password);
    await AsyncStorage.setItem('token', res.accessToken);
    setToken(res.accessToken);
    const u = await api.getMe();
    setUser({ userId: u.id, account: u.account, nickname: u.nickname, avatarUrl: u.avatarUrl, userCode: u.userCode });
  };

  const register = async (phone, account, password, nickname, userCode) => {
    const res = await api.register(phone, account, password, nickname, userCode);
    await AsyncStorage.setItem('token', res.accessToken);
    setToken(res.accessToken);
    const u = await api.getMe();
    setUser({ userId: u.id, account: u.account, nickname: u.nickname, avatarUrl: u.avatarUrl, userCode: u.userCode });
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const refresh = async () => {
    try {
      const u = await api.getMe();
      setUser({ userId: u.id, account: u.account, nickname: u.nickname, avatarUrl: u.avatarUrl, userCode: u.userCode });
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
