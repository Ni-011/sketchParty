import { Request, Response, Express } from "express";
import { Socket } from "dgram";
import express from "express";
import { Server } from "socket.io";
import { createServer, IncomingMessage, ServerResponse } from "http";
import cors from "cors";

interface mousePositionType {
  x: number;
  y: number;
}

interface drawDataType {
  initialPosition: { current: mousePositionType | null };
  mousePosition: mousePositionType;
  roomID: string;
  drawType: string; // "line", "rectangle", "circle", "freeHand"
}

const app: Express = express();
const port: number = parseInt(process.env.PORT || "8000");
const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Temporarily allow all origins for testing
    methods: ["GET", "POST"],
    credentials: false, // Set to false when using "*"
  },
});

app.use(express.json());
app.use(cors({
  origin: "*", // Temporarily allow all origins for testing
  credentials: false, // Set to false when using "*"
}));

app.get("/", (req: Request, res: Response) => {
  res.send("Sketch Party Backend Server is running!");
});

// Health check endpoint for keeping server alive
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
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

  socket.on("clearAll", (roomID: string) => {
    console.log(`Clear all request received for room: ${roomID}`);
    // Emit to all users in the room including the sender
    io.to(roomID).emit("clearCanvas", true);
    console.log(`Clear canvas command sent to all users in room: ${roomID}`);
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
