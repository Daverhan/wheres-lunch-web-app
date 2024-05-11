"use client";
import { useEffect, useState } from "react";
import { socket } from "../socket";
import { User } from "../interfaces";

export default function Lobby() {
  const [roomCode, setRoomCode] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [joinedUsers, setJoinedUsers] = useState<User[]>([]);

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

    const handleUpdateLobby = (users: User[]) => {
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
        <h2 className="fixed text-xl top-11">Room Code: {roomCode}</h2>
      ) : null}
      <div>
        {joinedUsers.map((user) => (
          <div className="m-1 grid grid-cols-[85%_15%] w-80 md:w-96">
            <div className="p-0.5 text-2xl border-2 border-solid border-black">
              {user.username}
            </div>
            <div className="p-0.5 text-2xl border-y-2 border-x-2 ml-0.5 border-black text-center">
              {user.ready ? "Y" : "N"}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
