import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer);

  let users: string[] = [];

  io.on("connection", (socket) => {
    socket.on("join-room", (roomCode, username) => {
      if (!users.includes(username)) {
        socket.data.username = username;
        users.push(username);
      }
      io.emit("update-lobby", users);
    });

    socket.on("disconnect", () => {
      const username = socket.data.username;

      if (username) {
        const indexToRemove = users.indexOf(username);
        if (indexToRemove !== -1) {
          users.splice(indexToRemove, 1);
          io.emit("update-lobby", users);
        }
      }
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
