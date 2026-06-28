import { create } from 'zustand';
import { chatApi, userApi, notifApi } from '../lib/api';
import { getSocket, disconnectSocket } from '../lib/socket';

interface User { id: string; phone: string; account: string; nickname: string; avatarUrl: string; }
interface Session {
  id: string; type: 'single' | 'group'; name?: string; members: string[];
  lastMessage: any; otherMembers: { id: string; nickname: string; avatarUrl: string }[];
  createdAt?: string;
}
interface Message { id: string; sessionId: string; senderId: string; type: string; content: string; createdAt: string; sender: any; }
interface Notification { id: string; type: string; title: string; content: string; read: boolean; createdAt: string; }


interface AppState {
  user: User | null;
  token: string | null;
  sessions: Session[];
  currentSessionId: string | null;
  messages: Record<string, Message[]>;
  notifications: Notification[];
  onlineUsersArray: string[];
  typingUsers: Record<string, string[]>;

  setAuth: (token: string, user: User) => void;
  setUser: (user: User) => void;
  logout: () => void;
  fetchSessions: () => Promise<void>;
  setCurrentSession: (id: string) => void;
  fetchMessages: (sessionId: string) => Promise<void>;
  sendWsMessage: (sessionId: string, type: string, content: string) => void;
  addIncomingMessage: (msg: Message) => void;
  fetchNotifications: () => Promise<void>;
  markNotifRead: (id: string) => Promise<void>;
  fetchProfile: () => Promise<void>;
  initSocket: () => void;
  isOnline: (userId: string) => boolean;
}

export const useStore = create<AppState>((set, get) => ({
  user: (() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  })(),
  token: localStorage.getItem('token'),
  sessions: [],
  currentSessionId: null,
  messages: {},
  notifications: [],
  onlineUsersArray: [],
  typingUsers: {},

  setAuth: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
    get().initSocket();
  },

  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    disconnectSocket();
    set({ token: null, user: null, sessions: [], messages: {}, notifications: [] });
  },

  fetchProfile: async () => {
    try {
      const user = await userApi.getMe();
      set({ user });
      localStorage.setItem('user', JSON.stringify(user));
    } catch { get().logout(); }
  },

  fetchSessions: async () => {
    const sessions = await chatApi.getSessions();
    set({ sessions });
  },

  setCurrentSession: (id) => set({ currentSessionId: id }),

  fetchMessages: async (sessionId) => {
    const msgs = await chatApi.getMessages(sessionId);
    set(state => ({ messages: { ...state.messages, [sessionId]: msgs } }));
  },

  sendWsMessage: (sessionId, type, content) => {
    const socket = getSocket();
    socket.emit('message:send', { sessionId, type, content });
  },

  addIncomingMessage: (msg) => {
    set(state => {
      const list = state.messages[msg.sessionId] || [];
      if (list.some(m => m.id === msg.id)) return state;
      const updated = { ...state.messages, [msg.sessionId]: [...list, msg] };
      const sessions = state.sessions.map(s =>
        s.id === msg.sessionId ? { ...s, lastMessage: msg } : s
      );
      sessions.sort((a, b) => {
        const at = a.lastMessage?.createdAt || a.createdAt;
        const bt = b.lastMessage?.createdAt || b.createdAt;
        return new Date(bt).getTime() - new Date(at).getTime();
      });
      return { messages: updated, sessions };
    });
  },

  fetchNotifications: async () => {
    const notifications = await notifApi.getAll();
    set({ notifications });
  },

  markNotifRead: async (id) => {
    await notifApi.markRead(id);
    set(state => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n),
    }));
  },

  isOnline: (userId: string) => {
    return get().onlineUsersArray.includes(userId);
  },

  initSocket: () => {
    const socket = getSocket();
    socket.off('message:new');
    socket.off('user:online');
    socket.off('user:offline');
    socket.off('typing');

    socket.on('message:new', (msg: Message) => {
      get().addIncomingMessage(msg);
    });
    socket.on('user:online', ({ userId }: any) => {
      set(state => {
        if (state.onlineUsersArray.includes(userId)) return state;
        return { onlineUsersArray: [...state.onlineUsersArray, userId] };
      });
    });
    socket.on('user:offline', ({ userId }: any) => {
      set(state => ({
        onlineUsersArray: state.onlineUsersArray.filter(id => id !== userId),
      }));
    });
    socket.on('typing', ({ userId, sessionId }: any) => {
      set(state => {
        const list = state.typingUsers[sessionId] || [];
        if (!list.includes(userId)) return { typingUsers: { ...state.typingUsers, [sessionId]: [...list, userId] } };
        return state;
      });
      setTimeout(() => {
        set(state => ({
          typingUsers: { ...state.typingUsers, [sessionId]: (state.typingUsers[sessionId] || []).filter(id => id !== userId) },
        }));
      }, 2000);
    });

    socket.on('connect', () => {
      get().sessions.forEach(s => socket.emit('session:join', { sessionId: s.id }));
    });
  },
}));
