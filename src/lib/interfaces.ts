export interface User {
  username: string;
  ready: boolean;
  selections: string[];
  votes: string[];
  lastTimeActive: number;
}

export interface Lobby {
  users: User[];
  selections: string[];
  locationWon: string;
  state: string;
}

export interface LobbyProps {
  onLoaded: () => void;
}

declare global {
  interface Window {
    initAutocomplete?: () => void;
  }
}
