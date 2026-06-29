export async function api(path: string, options: any = {}) {
  const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').trim();
  const res = await fetch(BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + getToken(),
      ...options.headers,
    },
  });
  if (!res.ok) {
    let message = res.statusText || '请求失败';
    try {
      const data = await res.json();
      if (data && typeof data === 'object' && typeof data.message === 'string' && data.message) {
        message = data.message;
      }
    } catch(e) {
      // ignore json parse errors
    }
    if (res.status === 0 || res.status >= 500) {
      message = '服务不可用，请稍后再试';
    }
    throw new Error(message);
  }
  return res.json();
}

function getToken() {
  return localStorage.getItem('token') || '';
}

export async function uploadFile(path: string, file: File) {
  const BASE = (import.meta.env.VITE_API_URL || '').trim();
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(BASE ? BASE + path : path, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + getToken() },
    body: formData,
  });
  if (!res.ok) {
    let message = res.statusText || '上传失败';
    try {
      const data = await res.json();
      if (data && typeof data === 'object' && typeof data.message === 'string' && data.message) {
        message = data.message;
      }
    } catch(e) {
      // ignore json parse errors
    }
    throw new Error(message);
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
  uploadVoice: (sessionId: string, file: Blob, duration: number) => {
    const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').trim();
    const formData = new FormData();
    formData.append('file', file, 'voice.webm');
    formData.append('duration', String(duration));
    return fetch(BASE + '/chat/sessions/' + sessionId + '/upload-voice', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + getToken() },
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        let message = '语音上传失败';
        try { const data = await res.json(); if (data?.message) message = data.message; } catch(e) {}
        throw new Error(message);
      }
      return res.json();
    });
  },
};

export const userApi = {
  getMe: () => api('/users/me'),
  updateMe: (data: any) => api('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
  search: (q: string) => api('/users/search?q=' + encodeURIComponent(q)),
  getById: (id: string) => api('/users/' + id).catch(async () => { try { const list = await api('/users/search?q=' + encodeURIComponent(id)); return Array.isArray(list) ? list.find((u: any) => u.id === id) || null : null; } catch(e) { return null; } }),
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


export const feedbackApi = {
  submit: (data: { type: string; content: string; contact?: string }) => api('/feedback', { method: 'POST', body: JSON.stringify(data) }),
  getMine: () => api('/feedback'),
};
export const notifApi = {
  getAll: () => api('/notifications'),
  markRead: (id: string) => api('/notifications/' + id + '/read', { method: 'PATCH' }),
  markAllRead: () => api('/notifications/read-all', { method: 'POST' }),
};



