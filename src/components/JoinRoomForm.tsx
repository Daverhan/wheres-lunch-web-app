"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinRoomForm() {
  const [errorMessage, setErrorMessage] = useState<string>("");
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);

    const response = await fetch("/api/join_room", {
      method: "POST",
      body: formData,
    });

    if (response.ok) router.push("/lobby/create_selections");
    else {
      const responseJSON = await response.json();
      const errorMessagePrefix = "Unable to join the room";

      if (
        responseJSON.error_code === "ROOM_HAS_STARTED" ||
        responseJSON.error_code === "USERNAME_UNAVAILABLE" ||
        responseJSON.error_code === "EMPTY_INPUT_FIELDS" ||
        responseJSON.error_code === "ROOM_CODE_TOO_LONG" ||
        responseJSON.error_code === "USERNAME_TOO_LONG" ||
        responseJSON.error_code === "INVALID_INPUT_FIELDS"
      )
        setErrorMessage(`${errorMessagePrefix}: ${responseJSON.error}`);
      else setErrorMessage(errorMessagePrefix);
    }
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col text-2xl items-center gap-6"
      >
        <div className="flex flex-col gap-4">
          <input
            placeholder="Room Code"
            type="text"
            name="room_code"
            id="room_code"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          ></input>
          <input
            placeholder="Username"
            type="text"
            name="username"
            id="username"
            autoComplete="off"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          ></input>
        </div>
        <button className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow">
          Join Room
        </button>
      </form>
      {errorMessage ? (
        <h2 className="mt-6 text-2xl text-center">{errorMessage}</h2>
      ) : null}
    </div>
  );
}
