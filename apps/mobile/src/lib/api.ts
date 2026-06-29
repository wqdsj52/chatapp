import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://chatapp-server-production-2a51.up.railway.app';

async function getToken() {
  return AsyncStorage.getItem('token');
}

async function request(path, options = {}) {
  const token = await getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(BASE_URL + path, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Request failed');
  }
  return res.json();
}

async function uploadFile(path, fileUri, fileName, mimeType) {
  const token = await getToken();
  const formData = new FormData();
  formData.append('file', { uri: fileUri, name: fileName || 'file', type: mimeType || 'application/octet-stream' });
  const res = await fetch(BASE_URL + path, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Upload failed');
  }
  return res.json();
}

export const api = {
  login: (account, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ account, password }) }),
  register: (phone, account, password, nickname) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ phone, account, password, nickname }) }),
  getMe: () => request('/users/me'),
  updateMe: (data) =>
    request('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
  searchUsers: (q) => request('/users/search?q=' + encodeURIComponent(q)),
  uploadAvatar: (fileUri, fileName, mimeType) =>
    uploadFile('/upload/avatar', fileUri, fileName, mimeType),
  getFriends: () => request('/friends'),
  addFriend: (id) => request('/friends/' + id, { method: 'POST' }),
  removeFriend: (id) => request('/friends/' + id, { method: 'DELETE' }),
  checkFriend: (id) => request('/friends/' + id + '/check'),
  getSessions: () => request('/chat/sessions'),
  createSingleSession: (targetUserId) =>
    request('/chat/sessions/single', { method: 'POST', body: JSON.stringify({ targetUserId }) }),
  getMessages: (sessionId, cursor) =>
    request('/chat/sessions/' + sessionId + '/messages' + (cursor ? '?cursor=' + cursor : '')),
  sendMessage: (sessionId, type, content) =>
    request('/chat/sessions/' + sessionId + '/messages', { method: 'POST', body: JSON.stringify({ type, content }) }),
  uploadChatFile: (sessionId, fileUri, fileName, mimeType) =>
    uploadFile('/chat/sessions/' + sessionId + '/upload', fileUri, fileName, mimeType),
  getNotifications: () => request('/notifications'),
  markRead: (id) => request('/notifications/' + id + '/read', { method: 'PATCH' }),
  markAllRead: () => request('/notifications/read-all', { method: 'POST' }),
};
