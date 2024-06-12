"use client";
import { useState, useEffect, FormEvent } from "react";
import { socket } from "../../src/socket";

export default function VoteSelectionsForm() {
  const [selections, setSelections] = useState<string[]>([]);
  const [selectedVotes, setSelectedVotes] = useState<string[]>([]);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);

  const handleVoteConfirmation = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    socket.emit("confirm-votes", selectedVotes);
  };

  const handleCheckboxChange = (selection: string) => {
    setSelectedVotes((prevSelectedVotes) => {
      if (prevSelectedVotes.includes(selection)) {
        return prevSelectedVotes.filter((vote) => vote !== selection);
      } else {
        return [...prevSelectedVotes, selection];
      }
    });
  };

  useEffect(() => {
    socket.emit("get-selections-request");

    socket.on("get-selections-response", (allSelections) => {
      setSelections(allSelections);
    });
  }, []);

  useEffect(() => {
    if (selections.length > 0) setHasLoaded(true);
  }, [selections]);

  return (
    <>
      {hasLoaded ? (
        <form
          onSubmit={handleVoteConfirmation}
          className="flex flex-col w-80 sm:w-96 px-1 gap-2 mt-4"
        >
          <h2 className="text-lg sm:text-3xl text-center mt-4">Voting Phase</h2>
          <h3 className="text-center sm:text-2xl -mt-2">
            Vote for your choices
          </h3>
          <div className="flex flex-col gap-3">
            {selections.map((selection, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="checkbox"
                  id={"selection_" + index}
                  name={"selection_" + index}
                  onChange={() => handleCheckboxChange(selection)}
                  className="h-6 sm:h-7 w-5"
                />
                <label htmlFor={"selection_" + index} className="sm:text-xl">
                  {selection}
                </label>
              </div>
            ))}
          </div>
          <button className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border sm:text-2xl border-gray-400 mt-2 rounded shadow">
            Confirm Votes
          </button>
        </form>
      ) : null}
    </>
  );
}
