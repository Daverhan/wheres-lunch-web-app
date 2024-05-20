export interface User {
  username: string;
  ready: boolean;
  selections: string[];
  votes: string[];
}

export interface Lobby {
  users: User[];
  selections: string[];
  locationWon: string;
  gameState: string;
}

export interface LobbyProps {
  onLoaded: () => void;
}

declare module "iron-session" {
  interface IronSession {
    roomCode: string;
    username: string;
    save: () => Promise<void>;
    destroy: () => void;
  }
}
