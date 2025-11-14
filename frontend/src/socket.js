import { io } from 'socket.io-client';

/*const socket = io('http://localhost:3001', {
  withCredentials: true,
});*/
const socket = io(`${process.env.REACT_APP_API_URL}`, {
  withCredentials: true,
});

export default socket;
