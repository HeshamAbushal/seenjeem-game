import { io } from 'socket.io-client';

const hostIp = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? '172.21.4.79'
  : window.location.hostname;

const SOCKET_URL = (import.meta as any).env?.VITE_SOCKET_URL || 
  `${window.location.protocol}//${hostIp}:3000`;

// Initialize socket connection. TV will connect on startup.
export const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  autoConnect: true
});
