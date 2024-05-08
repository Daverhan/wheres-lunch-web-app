import EnterRoomCode from "./EnterRoomCode";

export default function Home() {
  return (
    <section className="flex flex-col mt-20 bg-purple-200 min-h-screen-adjusted">
      <div className="flex flex-col items-center mt-4 gap-6">
        <h2 className="text-center">
          If the entered room code exists, you will join the room. If it does
          not exist, one will be created.
        </h2>
        <EnterRoomCode />
      </div>
    </section>
  );
}
