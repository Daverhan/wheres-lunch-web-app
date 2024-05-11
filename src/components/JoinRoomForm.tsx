"use client";
import { FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function JoinRoomForm() {
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);

    const response = await fetch("/api/join_room", {
      method: "POST",
      body: formData,
    });

    if (response.ok) router.push("/lobby/create_selections");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col text-xl items-center gap-6"
    >
      <div className="flex flex-col gap-4 text-xl">
        <input
          placeholder="Room Code"
          type="text"
          name="room_code"
          id="room_code"
        ></input>
        <input
          placeholder="Username"
          type="text"
          name="username"
          id="username"
          autoComplete="off"
        ></input>
      </div>
      <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full w-36">
        Join Room
      </button>
    </form>
  );
}
