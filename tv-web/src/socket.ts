import { io } from 'socket.io-client';

const SOCKET_URL = (import.meta as any).env?.VITE_SOCKET_URL || 
  `${window.location.protocol}//${window.location.hostname}:3000`;

// Initialize socket connection. TV will connect on startup.
export const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  autoConnect: true
});
