import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { User } from "./src/interfaces";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer);

  let rooms = new Map<string, User[]>();

  io.on("connection", (socket) => {
    socket.on("join-room", (roomCode, username) => {
      if (!rooms.has(roomCode)) {
        rooms.set(roomCode, []);
      }

      if (!rooms.get(roomCode)?.some((user) => user.username === username)) {
        socket.data.username = username;
        socket.data.roomCode = roomCode;
        socket.join(roomCode);
        rooms.get(roomCode)?.push({
          username,
          ready: false,
          selections: [],
        });
      }

      io.to(roomCode).emit("update-lobby", rooms.get(roomCode));
    });

    socket.on("confirm-selections", (selections) => {
      const roomCode = socket.data.roomCode;
      const username = socket.data.username;
      const users = rooms.get(roomCode) as User[];

      if (username && roomCode) {
        const indexToModify = users.findIndex(
          (user) => user.username === username
        );

        if (indexToModify !== -1) {
          users[indexToModify].ready = true;
          users[indexToModify].selections = selections;
          io.to(roomCode).emit("update-lobby", rooms.get(roomCode));
        }
      }
    });

    socket.on("disconnect", () => {
      const roomCode = socket.data.roomCode;
      const username = socket.data.username;
      const users = rooms.get(roomCode) as User[];

      if (username && roomCode) {
        const indexToRemove = users.findIndex(
          (user) => user.username === username
        );

        if (indexToRemove !== -1) {
          rooms.get(roomCode)?.splice(indexToRemove, 1);
          io.to(roomCode).emit("update-lobby", rooms.get(roomCode));
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
