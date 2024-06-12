"use client";
import { ReactNode, useState } from "react";
import Lobby from "../../components/Lobby";

export default function LobbyLayout({ children }: { children: ReactNode }) {
  const [lobbyLoaded, setLobbyLoaded] = useState(false);

  return (
    <section className="flex flex-col items-center mt-20">
      <Lobby
        lobbyLoaded={lobbyLoaded}
        setLobbyLoaded={(isLobbyLoaded: boolean) =>
          setLobbyLoaded(isLobbyLoaded)
        }
      />
      {lobbyLoaded && children}
    </section>
  );
}
