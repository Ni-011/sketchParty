import { io } from "socket.io-client";

const socket: any = io("http://localhost:8000");

export default socket;
