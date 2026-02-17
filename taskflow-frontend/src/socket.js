import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_SERVER_URL, {
  withCredentials: true,
  autoConnect: false
});

console.log("Connecting to:", import.meta.env.VITE_SERVER_URL);


export default socket;
