const express = require("express");
const app = express();
const port = 8000;
const httpServer = require("http")(app);
const io = require("socket.io")(httpServer);
app.use(express.json());
app.get("/", (req, res) => {
    res.send("Hello World!");
});
const connections = [];
io.on("connection", (socket) => {
    connections.push(socket);
    console.log(`${socket.id} has connected`);
    socket.on("draw", (data) => {
        connections.forEach((connection) => {
            if (connection.id !== socket.id) {
                connection.emit("otherUsersDraw", data);
            }
        });
    });
    socket.on("disconnect", (reason) => {
        for (let i = 0; i < connections.length; i++) {
            if (connections[i].id !== socket.id) {
                console.log(`${socket.id} has disconnected`);
            }
        }
    });
});
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
export {};
//# sourceMappingURL=server.js.map