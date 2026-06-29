import { create } from 'zustand';
import { chatApi, userApi, notifApi, friendApi } from '../lib/api';
import { getSocket, disconnectSocket } from '../lib/socket';

interface User { id: string; phone: string; account: string; nickname: string; avatarUrl: string; userCode: string; gender: string; birthDate: string; bio: string; city: string; province: string; address: string; createdAt: string; }
interface Session {
  id: string; type: 'single' | 'group'; name?: string; members: string[];
  lastMessage: any; otherMembers: { id: string; nickname: string; avatarUrl: string }[];
  createdAt?: string;
}
interface Message { id: string; sessionId: string; senderId: string; type: string; content: string; createdAt: string; sender: any; }
interface Notification { id: string; type: string; title: string; content: string; read: boolean; createdAt: string; }

interface AppState {
  user: User | null; token: string | null; sessions: Session[]; currentSessionId: string | null;
  messages: Record<string, Message[]>; chatMeta: Record<string, { nickname: string; avatarUrl: string; id: string }>; notifications: Notification[]; friends: User[];
  onlineUsersArray: string[]; typingUsers: Record<string, string[]>;

  setAuth: (token: string, user: User) => void; setUser: (user: User) => void; logout: () => void;
  fetchSessions: () => Promise<void>; setCurrentSession: (id: string) => void;
  fetchMessages: (sessionId: string) => Promise<void>;
  sendWsMessage: (sessionId: string, type: string, content: string) => void;
  addIncomingMessage: (msg: Message) => void;
  fetchNotifications: () => Promise<void>; markNotifRead: (id: string) => Promise<void>;
  fetchProfile: () => Promise<void>; initSocket: () => void; isOnline: (userId: string) => boolean;
  fetchFriends: () => Promise<void>; addFriend: (id: string) => Promise<void>; removeFriend: (id: string) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
}

let initialChatMeta: Record<string, { nickname: string; avatarUrl: string; id: string }> = {};
try { initialChatMeta = JSON.parse(localStorage.getItem('chatMeta') || '{}'); } catch(e) { initialChatMeta = {}; }

export const useStore = create<AppState>((set, get) => ({
  user: (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch(e) { return null; } })(),
  token: localStorage.getItem('token'),
  sessions: [], currentSessionId: null, messages: {}, chatMeta: initialChatMeta, notifications: [], friends: [],
  onlineUsersArray: [], typingUsers: {},

  setAuth: (token, user) => { localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user)); set({ token, user }); get().initSocket(); },
  setUser: (user) => {
    // Merge with locally saved extra fields (gender, bio, etc.)
    let extra: any = {};
    try { extra = JSON.parse(localStorage.getItem('userExtra') || '{}'); } catch(e) {}
    const merged = { ...extra, ...user };
    localStorage.setItem('user', JSON.stringify(merged));
    // Save extra fields locally if they exist in the update
    const extraKeys = ['gender','birthDate','bio','province','city','address'];
    const hasExtra = extraKeys.some(k => (user as any)[k] !== undefined && (user as any)[k] !== null && (user as any)[k] !== '');
    if (hasExtra) {
      const currentExtra: any = {};
      for (const k of extraKeys) { if ((merged as any)[k]) currentExtra[k] = (merged as any)[k]; }
      localStorage.setItem('userExtra', JSON.stringify(currentExtra));
    }
    set({ user: merged });
  },
  logout: () => { localStorage.removeItem('token'); localStorage.removeItem('user'); disconnectSocket(); set({ token: null, user: null, sessions: [], messages: {}, chatMeta: {}, notifications: [], friends: [] }); },

  fetchProfile: async () => {
      try {
        const apiUser = await userApi.getMe();
        let extra: any = {};
        try { extra = JSON.parse(localStorage.getItem('userExtra') || '{}'); } catch(e) {}
        const user = { ...extra, ...apiUser };
        set({ user });
        localStorage.setItem('user', JSON.stringify(user));
      } catch(e) { get().logout(); }
    },
  fetchSessions: async () => { const sessions = await chatApi.getSessions(); set({ sessions }); const singles = sessions.filter((s: any) => s.type === 'single' && (s.otherMembers||[]).length === 0); if (singles.length) { const me = get().user; if (me) { const meta: any = { ...(get().chatMeta || {}) }; (async()=>{ for (const s of singles) { try { const msgs = await chatApi.getMessages(s.id); for (const m of msgs) { if (m.senderId !== me.id && m.sender) { meta[s.id] = { nickname: m.sender.nickname || '未知', avatarUrl: m.sender.avatarUrl || '', id: m.senderId }; break; } } if (!meta[s.id]) meta[s.id] = { nickname:'未知', avatarUrl:'', id:'' }; } catch(e) { meta[s.id] = { nickname:'未知', avatarUrl:'', id:'' }; } } localStorage.setItem('chatMeta', JSON.stringify(meta)); set({ chatMeta: meta }); })(); } } },
  setCurrentSession: (id) => set({ currentSessionId: id }),
  fetchMessages: async (sessionId) => { const msgs = await chatApi.getMessages(sessionId); set(state => ({ messages: { ...state.messages, [sessionId]: msgs } })); },
  sendWsMessage: (sessionId, type, content) => { const socket = getSocket(); socket.emit('message:send', { sessionId, type, content }); },
  addIncomingMessage: (msg) => { set(state => { const list = state.messages[msg.sessionId] || []; if (list.some(m => m.id === msg.id)) return state; const updated = { ...state.messages, [msg.sessionId]: [...list, msg] }; const sessions = state.sessions.map(s => s.id === msg.sessionId ? { ...s, lastMessage: msg } : s); sessions.sort((a, b) => new Date(b.lastMessage?.createdAt || b.createdAt).getTime() - new Date(a.lastMessage?.createdAt || a.createdAt).getTime()); return { messages: updated, sessions }; }); },

  fetchNotifications: async () => { const notifications = await notifApi.getAll(); set({ notifications }); },
  markNotifRead: async (id) => { await notifApi.markRead(id); set(state => ({ notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n) })); },

  fetchFriends: async () => { try { const friends = await friendApi.getAll(); set({ friends }); } catch(e) {} },
  addFriend: async (id) => { await friendApi.add(id); await get().fetchFriends(); },
  removeFriend: async (id) => { await friendApi.remove(id); await get().fetchFriends(); },

  uploadAvatar: async (file) => {
        // Convert file to base64 data URL and save via updateMe
        const reader = new FileReader();
        const dataUrl: string = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        // Compress if too large (> 500KB)
        let finalUrl = dataUrl;
        if (dataUrl.length > 500 * 1024) {
          const img = new Image();
          await new Promise<void>((resolve) => { img.onload = () => resolve(); img.src = dataUrl; });
          const canvas = document.createElement('canvas');
          const maxW = 200;
          const scale = Math.min(maxW / img.width, maxW / img.height, 1);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          finalUrl = canvas.toDataURL('image/jpeg', 0.8);
        }
        const updated = await userApi.updateMe({ avatarUrl: finalUrl });
        get().setUser(updated);
      },

  isOnline: (userId) => get().onlineUsersArray.includes(userId),

  initSocket: () => {
    const socket = getSocket();
    socket.off('message:new'); socket.off('user:online'); socket.off('user:offline'); socket.off('typing');
    socket.on('message:new', (msg) => { get().addIncomingMessage(msg); const me = get().user; if (me && msg.senderId !== me.id) { const meta: any = { ...(get().chatMeta || {}) }; if (!meta[msg.sessionId]) { meta[msg.sessionId] = { nickname: msg.sender?.nickname || '未知', avatarUrl: msg.sender?.avatarUrl || '', id: msg.senderId }; localStorage.setItem('chatMeta', JSON.stringify(meta)); set({ chatMeta: meta }); } } });
    socket.on('user:online', ({ userId }) => { set(state => { if (state.onlineUsersArray.includes(userId)) return state; return { onlineUsersArray: [...state.onlineUsersArray, userId] }; }); });
    socket.on('user:offline', ({ userId }) => { set(state => ({ onlineUsersArray: state.onlineUsersArray.filter(id => id !== userId) })); });
    socket.on('typing', ({ userId, sessionId }) => { set(state => { const list = state.typingUsers[sessionId] || []; if (!list.includes(userId)) return { typingUsers: { ...state.typingUsers, [sessionId]: [...list, userId] } }; return state; }); setTimeout(() => { set(state => ({ typingUsers: { ...state.typingUsers, [sessionId]: (state.typingUsers[sessionId] || []).filter(id => id !== userId) } })); }, 2000); });
    socket.on('connect', () => { get().sessions.forEach(s => socket.emit('session:join', { sessionId: s.id })); });
  },
}));




