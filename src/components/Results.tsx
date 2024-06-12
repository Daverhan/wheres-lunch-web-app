"use client";
import { useEffect, useState } from "react";
import { socket } from "../socket";
import { useRouter } from "next/navigation";

export default function Results() {
  const [winner, setWinner] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/logout");
  };

  const goToHome = () => {
    router.replace("/");
  };

  useEffect(() => {
    const handleResultsResponse = (winner: string) => {
      setWinner(winner);
      setHasLoaded(true);
      logout();
    };

    socket.emit("get-results-request");

    socket.on("get-results-response", handleResultsResponse);

    return () => {
      socket.off("get-results-response", handleResultsResponse);
      socket.disconnect();
    };
  }, []);

  return (
    <>
      {hasLoaded ? (
        <section className="flex flex-col mt-20">
          <h2 className="absolute text-xl top-11 left-1/2 -translate-x-1/2">
            Results
          </h2>
          <div className="flex flex-col text-2xl items-center gap-6">
            <h2 className="text-center mt-2">
              Lunch is at <span className="font-bold">{winner}</span>
            </h2>
            <button
              onClick={goToHome}
              className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
            >
              Home
            </button>
          </div>
        </section>
      ) : null}
    </>
  );
}
