declare module "iron-session" {
  interface IronSession {
    roomCode: string;
    username: string;
    save: () => Promise<void>;
    destroy: () => void;
  }
}

export function getIronSession(): IronSession;
