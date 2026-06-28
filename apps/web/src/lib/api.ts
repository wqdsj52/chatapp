const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getToken() {
  return localStorage.getItem('token') || '';
}

export async function api(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || '请求失败');
  }
  return res.json();
}

export const authApi = {
  register: (data: { phone: string; account: string; password: string; nickname?: string }) =>
    api('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { account: string; password: string }) =>
    api('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  loginBySms: (data: { phone: string; code: string }) =>
    api('/auth/login/sms', { method: 'POST', body: JSON.stringify(data) }),
  sendSms: (phone: string) =>
    api('/auth/sms/send', { method: 'POST', body: JSON.stringify({ phone }) }),
};

export const chatApi = {
  getSessions: () => api('/chat/sessions'),
  createSingleSession: (targetUserId: string) =>
    api('/chat/sessions/single', { method: 'POST', body: JSON.stringify({ targetUserId }) }),
  createGroupSession: (memberIds: string[], name: string) =>
    api('/chat/sessions/group', { method: 'POST', body: JSON.stringify({ memberIds, name }) }),
  getMessages: (sessionId: string, cursor?: string) =>
    api(`/chat/sessions/${sessionId}/messages${cursor ? `?cursor=${cursor}` : ''}`),
  sendMessage: (sessionId: string, type: string, content: string) =>
    api(`/chat/sessions/${sessionId}/messages`, { method: 'POST', body: JSON.stringify({ type, content }) }),
};

export const userApi = {
  getMe: () => api('/users/me'),
  updateMe: (data: { nickname?: string; avatarUrl?: string }) =>
    api('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
  search: (q: string) => api(`/users/search?q=${encodeURIComponent(q)}`),
};

export const notifApi = {
  getAll: () => api('/notifications'),
  markRead: (id: string) => api(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => api('/notifications/read-all', { method: 'POST' }),
};
