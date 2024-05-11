"use client";
import { FormEvent, useEffect, useState } from "react";
import { socket } from "../socket";
import { User } from "../interfaces";

export default function Lobby() {
  const [roomCode, setRoomCode] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [joinedUsers, setJoinedUsers] = useState<User[]>([]);

  const handleSelectionConfirmation = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);

    const firstSelection = formData.get("first_selection")?.toString();
    const secondSelection = formData.get("second_selection")?.toString();
    const thirdSelection = formData.get("third_selection")?.toString();

    const selections: string[] = [];

    if (firstSelection) selections.push(firstSelection);
    if (secondSelection) selections.push(secondSelection);
    if (thirdSelection) selections.push(thirdSelection);

    if (selections.length > 0) {
      socket.emit("confirm-selections", selections);
    }
  };

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
      <form
        onSubmit={handleSelectionConfirmation}
        className="flex flex-col w-80 sm:w-96 px-1 gap-2 mt-4"
      >
        <h2 className="text-lg sm:text-2xl text-center">
          Enter up to three locations
        </h2>
        <input
          className="sm:text-lg"
          placeholder="First Selection"
          type="text"
          name="first_selection"
          id="first_selection"
        />
        <input
          className="sm:text-lg"
          placeholder="Second Selection"
          type="text"
          name="second_selection"
          id="second_selection"
        />
        <input
          className="sm:text-lg"
          placeholder="Third Selection"
          type="text"
          name="third_selection"
          id="third_selection"
        />
        <button className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border sm:text-xl border-gray-400 mt-2 rounded shadow">
          Confirm Selections
        </button>
      </form>
    </section>
  );
}
