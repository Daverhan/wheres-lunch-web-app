"use client";
import { useEffect, useState } from "react";
import { socket } from "../socket";

export default function Lobby() {
  const [roomCode, setRoomCode] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [joinedUsers, setJoinedUsers] = useState<string[]>([]);

  useEffect(() => {
    const getUserInfo = async () => {
      const response = await fetch("/api/current_user");

      if (response.ok) {
        const responseJSON = await response.json();
        setRoomCode(responseJSON.roomCode);
        setUsername(responseJSON.username);

        socket.connect();
        socket.emit("join-room", responseJSON.roomCode, responseJSON.username);
      }
    };

    getUserInfo();

    const handleUpdateLobby = (users: string[]) => {
      setJoinedUsers(users);
    };

    socket.on("update-lobby", handleUpdateLobby);

    const handleBeforeUnload = () => {
      socket.disconnect();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      handleBeforeUnload();
    };
  }, []);

  return (
    <section className="flex flex-col items-center mt-20 bg-purple-200 min-h-screen-adjusted">
      {roomCode ? (
        <h2 className="absolute text-xl top-11">Room Code: {roomCode}</h2>
      ) : null}
      {joinedUsers.map((username) => (
        <div className="text-2xl">{username}</div>
      ))}
    </section>
  );
}
