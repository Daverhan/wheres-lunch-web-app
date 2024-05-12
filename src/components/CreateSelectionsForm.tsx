"use client";
import { FormEvent } from "react";
import { socket } from "../../src/socket";

export default function CreateSelectionsForm() {
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

  return (
    <form
      onSubmit={handleSelectionConfirmation}
      className="flex flex-col w-80 sm:w-96 px-1 gap-2 mt-4"
    >
      <h2 className="text-lg sm:text-2xl text-center">Selection Phase</h2>
      <h3 className="text-center sm:text-lg -mt-2">
        Enter up to three choices
      </h3>
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
  );
}