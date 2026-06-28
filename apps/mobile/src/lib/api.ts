import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://chatapp-server-production-2a51.up.railway.app';

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem('token');
}

async function request(path: string, options: RequestInit = {}): Promise<any> {
  const token = await getToken();
  const headers: any = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Request failed');
  }
  return res.json();
}

export const api = {
  login: (account: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ account, password }) }),
  register: (phone: string, account: string, password: string, nickname?: string) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ phone, account, password, nickname }) }),
  getMe: () => request('/users/me'),
  updateMe: (data: { nickname?: string; avatarUrl?: string }) =>
    request('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
  searchUsers: (q: string) => request(`/users/search?q=${encodeURIComponent(q)}`),
  getSessions: () => request('/chat/sessions'),
  createSingleSession: (targetUserId: string) =>
    request('/chat/sessions/single', { method: 'POST', body: JSON.stringify({ targetUserId }) }),
  getMessages: (sessionId: string, cursor?: string) =>
    request(`/chat/sessions/${sessionId}/messages${cursor ? `?cursor=${cursor}` : ''}`),
  sendMessage: (sessionId: string, type: string, content: string) =>
    request(`/chat/sessions/${sessionId}/messages`, { method: 'POST', body: JSON.stringify({ type, content }) }),
  getNotifications: () => request('/notifications'),
  markRead: (id: string) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => request('/notifications/read-all', { method: 'POST' }),
};
