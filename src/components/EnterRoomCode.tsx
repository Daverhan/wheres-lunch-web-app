"use client";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function EnterRoomCode() {
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);

    /*
        const response = await fetch("/api/join_room", {
          method: "POST",
          body: formData,
        });
    */

    router.push("/enter_details");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col text-xl items-center gap-6"
    >
      <div className="flex gap-2 text-xl">
        <label htmlFor="room_code">Room Code:</label>
        <input type="text" name="room_code" id="room_code"></input>
      </div>
      <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full w-36">
        Join Room
      </button>
    </form>
  );
}
