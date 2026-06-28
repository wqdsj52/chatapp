import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

interface User {
  userId: string;
  account: string;
  nickname?: string;
  avatarUrl?: string;
}

interface AuthCtx {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (account: string, password: string) => Promise<void>;
  register: (phone: string, account: string, password: string, nickname?: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>(null as any);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem('token');
      if (t) {
        setToken(t);
        try {
          const u = await api.getMe();
          setUser({ userId: u.id, account: u.account, nickname: u.nickname, avatarUrl: u.avatarUrl });
        } catch {
          await AsyncStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = async (account: string, password: string) => {
    const res = await api.login(account, password);
    await AsyncStorage.setItem('token', res.accessToken || res.access_token || res.token);
    setToken(res.accessToken || res.access_token || res.token);
    const u = await api.getMe();
    setUser({ userId: u.id, account: u.account, nickname: u.nickname, avatarUrl: u.avatarUrl });
  };

  const register = async (phone: string, account: string, password: string, nickname?: string) => {
    const res = await api.register(phone, account, password, nickname);
    await AsyncStorage.setItem('token', res.accessToken || res.access_token || res.token);
    setToken(res.accessToken || res.access_token || res.token);
    const u = await api.getMe();
    setUser({ userId: u.id, account: u.account, nickname: u.nickname, avatarUrl: u.avatarUrl });
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const refresh = async () => {
    try {
      const u = await api.getMe();
      setUser({ userId: u.id, account: u.account, nickname: u.nickname, avatarUrl: u.avatarUrl });
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
