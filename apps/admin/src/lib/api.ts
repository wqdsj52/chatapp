const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getToken() {
  return localStorage.getItem('admin_token') || '';
}

export function setToken(token: string) {
  localStorage.setItem('admin_token', token);
}

export function clearToken() {
  localStorage.removeItem('admin_token');
}

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  });

  if (res.status === 401 || res.status === 403) {
    clearToken();
    throw new Error(
      res.status === 403
        ? String.fromCharCode(24403,21069,36134,21495,27809,26377,31649,29702,21592,26435,38480)
        : String.fromCharCode(30331,24405,24050,36807,26399,65292,35831,37325,26032,30331,24405)
    );
  }

  const text = await res.text();
  let data: any = text;
  try { data = JSON.parse(text); } catch { /* keep text */ }

  if (!res.ok) {
    const message = (data && typeof data === 'object' ? data.message : '') || res.statusText || String.fromCharCode(35831,27714,22833,36133);
    throw new Error(message);
  }

  return data as T;
}

export const authApi = {
  login: (data: { account: string; password: string }) =>
    api<{ accessToken: string; user: any }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => api<{ userId: string; account: string; role: string }>('/auth/me'),
};

export const adminApi = {
  getStats: () => api('/admin/stats'),
  getUsers: (q?: string) => api(`/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  getUserDetail: (id: string) => api(`/admin/users/${id}`),
  deleteUser: (id: string) => api(`/admin/users/${id}`, { method: 'DELETE' }),
  getSessions: (q?: string) => api(`/admin/sessions${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  deleteSession: (id: string) => api(`/admin/sessions/${id}`, { method: 'DELETE' }),
  getMessages: (sessionId: string, q?: string) => api(`/admin/sessions/${sessionId}/messages${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  deleteMessage: (sessionId: string, messageId: string) => api(`/admin/sessions/${sessionId}/messages/${messageId}`, { method: 'DELETE' }),
};
