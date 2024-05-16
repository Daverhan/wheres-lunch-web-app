import "dotenv/config";
import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { getLobby, saveLobby } from "./src/lib/redis";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer);

  io.on("connection", (socket) => {
    const updateLobbyAndCheckNextStep = async (roomCode: string) => {
      let lobby = await getLobby(roomCode);

      if (!lobby) return;

      await saveLobby(roomCode, lobby);
      io.to(roomCode).emit("update-lobby", lobby.users);

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
      lobby.selections = lobby.users.flatMap((user) => user.selections);

      await saveLobby(roomCode, lobby);
      await updateLobbyAndCheckNextStep(roomCode);

      io.to(roomCode).emit("proceed-to-voting", lobby.selections);
    };

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

    const proceedToResults = async (roomCode: string) => {
      let lobby = await getLobby(roomCode);

      if (!lobby)
        throw new Error("Lobby was unable to be retrieved in proceedToResults");

      lobby.gameState = "finished";
      const aggregatedVotes = new Map();

      lobby.users.forEach((user) => {
        user.votes.forEach((location) => {
          aggregatedVotes.set(
            location,
            (aggregatedVotes.get(location) || 0) + 1
          );
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

    socket.on("join-room", async (roomCode, username) => {
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
        });

        socket.data.username = username;
        socket.data.roomCode = roomCode;
        socket.join(roomCode);

        await saveLobby(roomCode, lobby);
      } else if (!lobby.users.some((user) => user.username === username)) {
        lobby.users.push({
          username,
          ready: false,
          selections: [],
          votes: [],
        });

        socket.data.username = username;
        socket.data.roomCode = roomCode;
        socket.join(roomCode);

        await saveLobby(roomCode, lobby);
      }

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

    socket.on("disconnect", async () => {
      const roomCode = socket.data.roomCode;
      const username = socket.data.username;
      let lobby = await getLobby(roomCode);

      if (!lobby) return;

      const indexToRemove = lobby.users.findIndex(
        (user) => user.username === username
      );
      if (indexToRemove !== -1) {
        lobby.users.splice(indexToRemove, 1);
        await saveLobby(roomCode, lobby);
        await updateLobbyAndCheckNextStep(roomCode);
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
