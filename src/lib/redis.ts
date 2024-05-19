import Redis from "ioredis";
import { Lobby } from "./interfaces";
import cron from "node-cron";

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

cron.schedule("*/5 * * * *", async () => {
  let cursor = "0";

  do {
    const reply = await redis.scan(cursor, "MATCH", "lobby:*", "COUNT", 100);
    cursor = reply[0];
    const keys = reply[1];

    if (keys.length > 0) {
      const values = await redis.mget(...keys);

      const deletions = keys.map(async (key, index) => {
        const value = values[index];

        if (value) {
          const lobby = JSON.parse(value) as Lobby;

          if (lobby.gameState === "finished" || lobby.users.length === 0)
            await redis.del(key);
        }
      });
      await Promise.all(deletions);
    }
  } while (cursor !== "0");
});
