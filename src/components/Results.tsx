"use client";
import { useEffect, useState } from "react";
import { socket } from "../socket";

export default function Results() {
  const [winner, setWinner] = useState("");

  useEffect(() => {
    const getWinner = async () => {
      const response = await fetch("/api/current_user");

      if (response.ok) {
        const responseJSON = await response.json();

        socket.connect();
        socket.emit("get-results-request", responseJSON.roomCode);
        socket.on("get-results-response", (winner) => {
          setWinner(winner);
          socket.disconnect();
        });
      }
    };

    getWinner();
  }, []);

  return (
    <section className="flex flex-col mt-20 bg-purple-200 min-h-screen-adjusted">
      <h2 className="absolute text-xl top-11 left-1/2 -translate-x-1/2">
        Results
      </h2>
      <h2 className="text-2xl text-center">The winner is: {winner}</h2>
    </section>
  );
}
