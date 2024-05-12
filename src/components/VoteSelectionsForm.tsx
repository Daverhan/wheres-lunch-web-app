"use client";
import { useState, useEffect } from "react";
import { socket } from "../../src/socket";

export default function VoteSelectionsForm() {
  const [selections, setSelections] = useState<string[]>([]);

  const handleSetSections = () => {
    socket.emit("get-selections-request");
    socket.on("get-selections-response", (allSelections) => {
      setSelections(allSelections);
    });
  };

  useEffect(() => {
    if (socket.connected) {
      handleSetSections();
    } else {
      socket.once("connect", () => {
        handleSetSections();
      });
    }
  }, []);

  return (
    <form className="flex flex-col w-80 sm:w-96 px-1 gap-2 mt-4">
      <h2 className="text-lg sm:text-2xl text-center">Voting Phase</h2>
      <h3 className="text-center sm:text-lg -mt-2">Vote your top pick</h3>
      {selections.map((selection, index) => (
        <div key={index}>
          <p className="text-2xl">{selection}</p>
        </div>
      ))}
    </form>
  );
}
