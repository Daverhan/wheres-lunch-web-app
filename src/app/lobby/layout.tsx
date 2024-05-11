import { ReactNode } from "react";
import Lobby from "../../components/Lobby";

export default function LobbyLayout({ children }: { children: ReactNode }) {
  return (
    <section className="flex flex-col items-center mt-20 bg-purple-200 min-h-screen-adjusted">
      <Lobby />
      {children}
    </section>
  );
}
