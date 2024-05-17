"use client";
import { io } from "socket.io-client";

export const socket = io(
  process.env.NEXT_PUBLIC_LOCAL_NETWORK_ADDRESS || "http://localhost:3000",
  {
    autoConnect: false,
  }
);
