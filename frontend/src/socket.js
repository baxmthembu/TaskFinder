import { io } from 'socket.io-client';

// Configure socket connection with proper CORS and transport settings
const socket = io(`${process.env.REACT_APP_API_URL}`, {
  withCredentials: true,
  transports: ['polling', 'websocket'],
  timeout: 20000,
  forceNew: true,
});

export default socket;
