const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').trim();

function getToken() {
  return localStorage.getItem('token') || '';
}

export async function api(path: string, options: any = {}) {
  const res = await fetch(BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + getToken(),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || '请求失败');
  }
  return res.json();
}

export async function uploadFile(path: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + getToken() },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || '上传失败');
  }
  return res.json();
}

export const authApi = {
  register: (data: any) => api('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => api('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  loginBySms: (data: any) => api('/auth/login/sms', { method: 'POST', body: JSON.stringify(data) }),
  sendSms: (phone: string) => api('/auth/sms/send', { method: 'POST', body: JSON.stringify({ phone }) }),
};

export const chatApi = {
  getSessions: () => api('/chat/sessions'),
  createSingleSession: (targetUserId: string) =>
    api('/chat/sessions/single', { method: 'POST', body: JSON.stringify({ targetUserId }) }),
  createGroupSession: (memberIds: string[], name: string) =>
    api('/chat/sessions/group', { method: 'POST', body: JSON.stringify({ memberIds, name }) }),
  getMessages: (sessionId: string, cursor?: string) =>
    api('/chat/sessions/' + sessionId + '/messages' + (cursor ? '?cursor=' + cursor : '')),
  sendMessage: (sessionId: string, type: string, content: string) =>
    api('/chat/sessions/' + sessionId + '/messages', { method: 'POST', body: JSON.stringify({ type, content }) }),
  uploadFile: (sessionId: string, file: File) => uploadFile('/chat/sessions/' + sessionId + '/upload', file),
};

export const userApi = {
  getMe: () => api('/users/me'),
  updateMe: (data: any) => api('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
  search: (q: string) => api('/users/search?q=' + encodeURIComponent(q)),
  getById: (id: string) => api('/users/' + id),
  uploadAvatar: (file: File) => uploadFile('/upload/avatar', file),
};

export const friendApi = {
  getAll: () => api('/friends'),
  add: (id: string) => api('/friends/request/' + id, { method: 'POST' }),
  remove: (id: string) => api('/friends/' + id, { method: 'DELETE' }),
  check: (id: string) => api('/friends/' + id + '/check'),
  getPendingRequests: () => api('/friends/requests/pending'),
  acceptRequest: (requestId: string) => api('/friends/requests/' + requestId + '/accept', { method: 'POST' }),
  rejectRequest: (requestId: string) => api('/friends/requests/' + requestId + '/reject', { method: 'POST' }),
};

export const notifApi = {
  getAll: () => api('/notifications'),
  markRead: (id: string) => api('/notifications/' + id + '/read', { method: 'PATCH' }),
  markAllRead: () => api('/notifications/read-all', { method: 'POST' }),
};
