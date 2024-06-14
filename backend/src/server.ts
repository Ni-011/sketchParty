import { Request, Response } from "express";
import { Socket } from "dgram";
import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import cors from "cors";

const app: any = express();
const port = 8000;
const server: any = createServer(app);
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
  connections.push(socket);
  console.log(`${socket.id} has connected`);

  socket.on("draw", (data: any) => {
    connections.forEach((connection: any) => {
      if (connection.id !== socket.id) {
        connection.emit("otherUsersDraw", data);
      }
    });
  });

  socket.on("disconnect", (reason: any) => {
    for (let i = 0; i < connections.length; i++) {
      if (connections[i].id !== socket.id) {
        console.log(`${socket.id} has disconnected`);
      }
    }
  });
});

server.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
