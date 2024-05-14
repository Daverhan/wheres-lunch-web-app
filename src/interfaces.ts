export interface User {
  username: string;
  ready: boolean;
  selections: [];
  votes: [];
}

export interface Lobby {
  users: User[];
  selections: string[];
  locationWon: string;
  hasStarted: boolean;
}
