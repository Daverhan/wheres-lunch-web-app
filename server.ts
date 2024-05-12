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
  let selections = new Map<string, string[]>();
  let locationsWon = new Map<string, string>();

  io.on("connection", (socket) => {
    const proceedToVoting = (roomCode: string) => {
      const users = rooms.get(roomCode) as User[];

      users.forEach((user) => {
        user.ready = false;
      });

      io.to(roomCode).emit("update-lobby", rooms.get(roomCode));

      let gatherSelections: string[] = [];

      users.forEach((user) => {
        gatherSelections = gatherSelections.concat(user.selections);
      });

      selections.set(roomCode, gatherSelections);
      io.to(roomCode).emit("proceed-to-voting");
    };

    const proceedToResults = (roomCode: string) => {
      const users = rooms.get(roomCode) as User[];
      const aggregatedVotes = new Map<string, number>();

      users.forEach((user) => {
        user.votes.forEach((location) => {
          if (aggregatedVotes.has(location)) {
            aggregatedVotes.set(
              location,
              (aggregatedVotes.get(location) || 0) + 1
            );
          } else {
            aggregatedVotes.set(location, 1);
          }
        });
      });

      let maxVotes = -Infinity;
      const maxVoteKeys: string[] = [];

      for (const value of aggregatedVotes.values())
        if (value > maxVotes) maxVotes = value;

      for (const [key, value] of aggregatedVotes.entries())
        if (value === maxVotes) maxVoteKeys.push(key);

      const locationWon =
        maxVoteKeys[Math.floor(Math.random() * maxVoteKeys.length)];

      locationsWon.set(roomCode, locationWon);
      io.to(roomCode).emit("proceed-to-results");
    };

    socket.on("get-selections-request", () => {
      const roomCode = socket.data.roomCode;
      io.to(roomCode).emit("get-selections-response", selections.get(roomCode));
    });

    socket.on("get-results-request", (roomCode) => {
      socket.join(roomCode);
      io.to(roomCode).emit("get-results-response", locationsWon.get(roomCode));
    });

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
          votes: [],
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

      if (!users.some((user) => user.ready === false))
        proceedToVoting(roomCode);
    });

    socket.on("confirm-votes", (votes) => {
      const roomCode = socket.data.roomCode;
      const username = socket.data.username;
      const users = rooms.get(roomCode) as User[];

      if (username && roomCode) {
        const indexToModify = users.findIndex(
          (user) => user.username === username
        );

        if (indexToModify !== -1) {
          users[indexToModify].ready = true;
          users[indexToModify].votes = votes;
          io.to(roomCode).emit("update-lobby", rooms.get(roomCode));
        }
      }

      if (!users.some((user) => user.ready === false))
        proceedToResults(roomCode);
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

          if (!users.some((user) => user.ready === false))
            proceedToVoting(roomCode);
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
