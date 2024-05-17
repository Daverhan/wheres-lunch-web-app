import JoinRoomForm from "./JoinRoomForm";

export default function Home() {
  return (
    <section className="flex flex-col mt-20">
      <h2 className="absolute text-xl top-11 left-1/2 -translate-x-1/2">
        Join Room
      </h2>
      <div className="flex flex-col items-center mt-4 gap-6">
        <h2 className="text-lg text-center">
          If the entered room code exists, you will join the room. If it does
          not exist, one will be created.
        </h2>
        <JoinRoomForm />
      </div>
    </section>
  );
}
