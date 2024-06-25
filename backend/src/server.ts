import { Request, Response, Express } from "express";
import { Socket } from "dgram";
import express from "express";
import { Server } from "socket.io";
import { createServer, IncomingMessage, ServerResponse } from "http";
import cors from "cors";
import { MutableRefObject } from "react";

interface mousePositionType {
  x: number;
  y: number;
}

interface drawDataType {
  initialPosition: MutableRefObject<mousePositionType | null>;
  mousePosition: mousePositionType;
  roomID: string;
}

const app: Express = express();
const port: number = 8000;
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(express.json());
app.use(cors);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

const connections: any[] = [];

io.on("connection", (socket: any) => {
  // Joing the room
  socket.on("joinRequest", (room: string) => {
    socket.join(room);
    socket.emit("RoomJoined", true);
    console.log(`a user has joined the room roomID: ${room}`);
  });

  socket.on("draw", (data: drawDataType) => {
    socket.to(data.roomID).emit("otherUsersDraw", data);
  });

  socket.on("disconnect", (reason: any) => {
    console.log(`a user has disconnected`);
  });

  socket.on("close", (roomID: any) => {
    console.log(`a user has closed the room`);
    socket.leave(roomID);
  });
});

server.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
