"use client";
import { useEffect, useState } from "react";

export default function Lobby() {
  const [roomCode, setRoomCode] = useState<string>("");

  const getRoomCode = async () => {
    const response = await fetch("/api/room_code");

    if (response.ok) {
      const responseJSON = await response.json();
      setRoomCode(responseJSON.roomCode);
    }
  };

  useEffect(() => {
    getRoomCode();
  }, []);

  return (
    <section className="flex flex-col mt-20 bg-purple-200 min-h-screen-adjusted">
      {roomCode ? (
        <h2 className="absolute text-xl top-11 left-1/2 -translate-x-1/2">
          Room Code: {roomCode}
        </h2>
      ) : null}
      <h2 className="text-center mt-4">Lobby</h2>
    </section>
  );
}
