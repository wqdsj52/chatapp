import { create } from 'zustand';

interface AdminUser {
  userId: string;
  account: string;
  role?: string;
}

interface AdminState {
  token: string | null;
  user: AdminUser | null;
  setAuth: (token: string, user?: AdminUser) => void;
  logout: () => void;
}

function parseUserFromToken(token: string): AdminUser | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g,'+').replace(/_/g,'/')));
    return { userId: decoded.sub, account: decoded.account, role: decoded.role };
  } catch {
    return null;
  }
}

export const useAdmin = create<AdminState>((set) => ({
  token: localStorage.getItem('admin_token'),
  user: (() => {
    const t = localStorage.getItem('admin_token');
    return t ? parseUserFromToken(t) : null;
  })(),
  setAuth: (token, user) => {
    localStorage.setItem('admin_token', token);
    set({ token, user: user || parseUserFromToken(token) });
  },
  logout: () => {
    localStorage.removeItem('admin_token');
    set({ token: null, user: null });
  },
}));
