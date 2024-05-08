import { SessionOptions } from "iron-session";

if (!process.env.SECRET_COOKIE_PASSWORD) {
  throw new Error("Missing SECRET_COOKIE_PASSWORD environment variable");
}

export const sessionOptions: SessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD,
  cookieName: "session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

export default sessionOptions;
