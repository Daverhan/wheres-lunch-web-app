import Redis from "ioredis";
import { Lobby } from "./interfaces";

if (!process.env.REDIS_URL) {
  throw new Error("Missing REDIS_URL environment variable");
}

const redis = new Redis(process.env.REDIS_URL);

export const getLobby = async (roomCode: string): Promise<Lobby | null> => {
  const data = await redis.get(`lobby:${roomCode}`);
  return data ? JSON.parse(data) : null;
};

export const saveLobby = async (
  roomCode: string,
  lobbyData: Lobby
): Promise<void> => {
  await redis.set(`lobby:${roomCode}`, JSON.stringify(lobbyData));
};

export const deleteLobby = async (roomCode: string): Promise<void> => {
  await redis.del(`lobby:${roomCode}`);
};
