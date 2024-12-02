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
  drawType: string; // "line", "rectangle", "circle", "freeHand"
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
app.use(cors());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

const connections: any[] = [];

io.on("connection", (socket: any) => {
  console.log("a user has connected");
  // Joing the room
  socket.on("joinRequest", (room: string) => {
    socket.join(room);
    socket.emit("RoomJoined", true);
    console.log(`a user has joined the room roomID: ${room}`);
  });

  socket.on("draw", (data: drawDataType) => {
    console.log("drawing data sent to all rooms");
    socket.to(data.roomID).emit("otherUsersDraw", {
      ...data,
      drawType: data.drawType
    });
  });

  socket.on("close", (roomID: any) => {
    socket.to(socket.id).emit("closing", true);
    console.log("Closing request sent to FE");
    socket.leave(roomID);
    console.log(`a user has closed the room roomID: ${roomID}`);
  });

  socket.on("disconnect", (reason: any) => {
    console.log(`a user has disconnected`);
  });
});

server.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
