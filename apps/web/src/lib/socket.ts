import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket() {
  if (socket) return socket;
  const token = localStorage.getItem('token') || '';
  const url = (import.meta.env.VITE_API_URL || 'http://localhost:3001').trim();
  socket = io(url, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });
  socket.on('connect', () => console.log('Socket connected'));
  socket.on('disconnect', () => console.log('Socket disconnected'));
  return socket;
}

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}
