import "dotenv/config";
import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import cors from "cors";
import { redis, getLobby, saveLobby } from "./src/lib/redis.js";
import { Lobby } from "./src/lib/interfaces.js";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const corsOptions = {
      origin: "*",
      credentials: true,
    };
    cors(corsOptions)(req, res, () => {
      handler(req, res);
    });
  });

  const io = new Server(httpServer, {
    cors: {
      origin: [process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  setInterval(async () => {
    let cursor = "0";
    do {
      const reply = await redis.scan(cursor, "MATCH", "lobby:*", "COUNT", 100);
      cursor = reply[0];
      const keys = reply[1];

      for (const key of keys) {
        const value = await redis.get(key);
        if (value) {
          const lobby = JSON.parse(value) as Lobby;
          const currentTime = Date.now();
          let isUpdated = false;

          lobby.users = lobby.users.filter((user) => {
            if (currentTime - user.lastTimeActive > 30000) {
              isUpdated = true;
              return false;
            }
            return true;
          });

          if (lobby.users.length === 0 || lobby.gameState === "finished") {
            await redis.del(key);
          } else if (isUpdated) {
            await redis.set(key, JSON.stringify(lobby));
            const roomCode = key.split(":")[1];
            updateLobbyAndCheckNextStep(roomCode);
          }
        }
      }
    } while (cursor !== "0");
  }, 30000);

  const updateLobbyAndCheckNextStep = async (roomCode: string) => {
    let lobby = await getLobby(roomCode);

    if (!lobby) return;

    io.to(roomCode).emit("update-lobby", lobby.users);

    if (lobby.users.length <= 1) return;

    if (lobby.users.every((user) => user.ready)) {
      switch (lobby.gameState) {
        case "create_selections":
          proceedToVoting(roomCode);
          break;
        case "vote_selections":
          proceedToResults(roomCode);
          break;
        default:
          break;
      }
    }
  };

  const proceedToVoting = async (roomCode: string) => {
    let lobby = await getLobby(roomCode);

    if (!lobby)
      throw new Error("Lobby was unable to be retrieved in proceedToVoting");

    lobby.gameState = "vote_selections";
    lobby.users.forEach((user) => (user.ready = false));
    lobby.selections = Array.from(
      new Set(lobby.users.flatMap((user) => user.selections))
    );

    await saveLobby(roomCode, lobby);
    await updateLobbyAndCheckNextStep(roomCode);

    io.to(roomCode).emit("proceed-to-voting", lobby.selections);
  };

  const proceedToResults = async (roomCode: string) => {
    let lobby = await getLobby(roomCode);

    if (!lobby)
      throw new Error("Lobby was unable to be retrieved in proceedToResults");

    lobby.gameState = "finished";
    const aggregatedVotes = new Map();

    lobby.users.forEach((user) => {
      user.votes.forEach((location) => {
        aggregatedVotes.set(location, (aggregatedVotes.get(location) || 0) + 1);
      });
    });

    let maxVotes = Math.max(...aggregatedVotes.values());

    lobby.locationWon = [...aggregatedVotes.entries()]
      .filter(([_, v]) => v === maxVotes)
      .map(([k]) => k)[0];

    await saveLobby(roomCode, lobby);
    await updateLobbyAndCheckNextStep(roomCode);

    io.to(roomCode).emit("proceed-to-results");
  };

  io.on("connection", (socket) => {
    socket.on("get-selections-request", async () => {
      const roomCode = socket.data.roomCode;
      let lobby = await getLobby(roomCode);

      if (!lobby)
        throw new Error(
          "Lobby was unable to be retrieved in get-selections-request"
        );

      socket.emit("get-selections-response", lobby.selections);
    });

    socket.on("get-results-request", async (roomCode) => {
      let lobby = await getLobby(roomCode);

      if (!lobby)
        throw new Error(
          "Lobby was unable to be retrieved in get-results-request"
        );

      socket.emit("get-results-response", lobby.locationWon);
    });

    socket.on("confirm-votes", async (selectedVotes) => {
      const roomCode = socket.data.roomCode;
      const username = socket.data.username;
      let lobby = await getLobby(roomCode);

      if (!lobby)
        throw new Error("Lobby was unable to be retrieved in confirm-votes");

      const userIndex = lobby.users.findIndex(
        (user) => user.username === username
      );

      if (userIndex !== -1) {
        lobby.users[userIndex].votes = selectedVotes;
        lobby.users[userIndex].ready = true;
      }

      await saveLobby(roomCode, lobby);
      await updateLobbyAndCheckNextStep(roomCode);
    });

    socket.on("heartbeat", async () => {
      const roomCode = socket.data.roomCode;
      const username = socket.data.username;

      let lobby = await getLobby(roomCode);

      if (lobby) {
        const user = lobby.users.find((user) => user.username === username);

        if (user) user.lastTimeActive = Date.now();

        await saveLobby(roomCode, lobby);
      }
    });

    socket.on("join-room", async (roomCode, username, callback) => {
      let lobby = await getLobby(roomCode);

      if (!lobby) {
        lobby = {
          users: [],
          selections: [],
          locationWon: "",
          gameState: "create_selections",
        };

        lobby.users.push({
          username,
          ready: false,
          selections: [],
          votes: [],
          lastTimeActive: Date.now(),
        });

        socket.data.username = username;
        socket.data.roomCode = roomCode;
        socket.join(roomCode);

        await saveLobby(roomCode, lobby);
      } else {
        if (
          !lobby.users.some((user) => {
            return user.username === username;
          })
        ) {
          lobby.users.push({
            username,
            ready: false,
            selections: [],
            votes: [],
            lastTimeActive: Date.now(),
          });

          await saveLobby(roomCode, lobby);
        } else {
          const user = lobby.users.find((user) => user.username === username);

          if (user) user.lastTimeActive = Date.now();

          await saveLobby(roomCode, lobby);
        }

        socket.data.username = username;
        socket.data.roomCode = roomCode;
        socket.join(roomCode);
      }

      callback();
      io.to(roomCode).emit("update-lobby", lobby.users);
    });

    socket.on("confirm-selections", async (selections) => {
      const roomCode = socket.data.roomCode;
      const username = socket.data.username;
      let lobby = await getLobby(roomCode);

      if (!lobby)
        throw new Error(
          "Lobby was unable to be retrieved in confirm-selections"
        );

      const userIndex = lobby.users.findIndex(
        (user) => user.username === username
      );

      if (userIndex !== -1) {
        lobby.users[userIndex].selections = selections;
        lobby.users[userIndex].ready = true;
      }

      await saveLobby(roomCode, lobby);
      await updateLobbyAndCheckNextStep(roomCode);
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
