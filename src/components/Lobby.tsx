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
    <div className="flex flex-col items-center">
      {roomCode ? (
        <h2 className="fixed text-xl top-11">Room Code: {roomCode}</h2>
      ) : null}
      <div className="w-80 sm:w-96">
        <div className="m-1 grid grid-cols-[82.5%_17.5%]">
          <h2 className="text-xl sm:text-2xl">Username</h2>
          <h2 className="text-xl sm:text-2xl">Status</h2>
        </div>
      </div>
      <div className="w-80 sm:w-96">
        {joinedUsers.map((user) => (
          <div key={user.username} className="m-1 grid grid-cols-[82.5%_17.5%]">
            <div className="p-0.5 text-xl sm:text-2xl border-2 border-solid border-black">
              {user.username}
            </div>
            <div className="p-0.5 text-xl sm:text-2xl border-y-2 border-x-2 ml-0.5 border-black text-center">
              {user.ready ? "Y" : "N"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
