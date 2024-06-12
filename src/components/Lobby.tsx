"use client";
import { useEffect, useState, useRef } from "react";
import { socket } from "../socket";
import { User, LobbyProps } from "../lib/interfaces";
import { useRouter } from "next/navigation";
import {
  CLIENT_HEARTBEAT_INTERVAL,
  CREATION_LOBBY_STATE,
} from "../lib/constants";

export default function Lobby(props: LobbyProps) {
  const [roomCode, setRoomCode] = useState<string>("");
  const [joinedUsers, setJoinedUsers] = useState<User[]>([]);
  const joinedUsersRef = useRef<User[]>([]);
  const usernameRef = useRef<string>("");
  const roomCodeRef = useRef<string>("");
  const router = useRouter();

  const joinRoom = () => {
    socket.emit("join-room", roomCodeRef.current, usernameRef.current);
  };

  const verifyLobbyState = async () => {
    const currentRoomStatusResponse = await fetch("/api/room_status");

    if (currentRoomStatusResponse.ok) {
      const responseJSON = await currentRoomStatusResponse.json();

      if (
        window.location.pathname !== "/lobby/create_selections" &&
        responseJSON.roomStatus === CREATION_LOBBY_STATE
      ) {
        router.replace("/lobby/create_selections");
      }
    }
  };

  useEffect(() => {
    const setupLobby = async () => {
      const currentUserResponse = await fetch("/api/current_user");

      if (currentUserResponse.ok) {
        const responseJSON = await currentUserResponse.json();

        setRoomCode(responseJSON.roomCode);
        roomCodeRef.current = responseJSON.roomCode;
        usernameRef.current = responseJSON.username;

        if (socket.connected) socket.disconnect();

        socket.connect();
        socket.on("connect", joinRoom);
      }
    };

    setupLobby();

    const heartbeat = setInterval(() => {
      socket.emit("heartbeat");
    }, CLIENT_HEARTBEAT_INTERVAL);

    const handleUpdateLobby = (users: User[]) => {
      setJoinedUsers(users);
      joinedUsersRef.current = users;
    };

    const goToVoteSelections = () => {
      router.replace("/lobby/vote_selections");
    };

    const goToResults = () => {
      router.replace("/results");
    };

    socket.on("update-lobby", handleUpdateLobby);
    socket.on("proceed-to-voting", goToVoteSelections);
    socket.on("proceed-to-results", goToResults);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        props.setLobbyLoaded(false);
        socket.disconnect();
        socket.connect();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(heartbeat);
      socket.off("connect", joinRoom);
      socket.off("update-lobby", handleUpdateLobby);
      socket.off("proceed-to-voting", goToVoteSelections);
      socket.off("proceed-to-results", goToResults);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (joinedUsers.length > 0 && roomCode) {
      verifyLobbyState();
      props.setLobbyLoaded(true);
    }
  }, [joinedUsers, roomCode]);

  return (
    <>
      {props.lobbyLoaded ? (
        <div className="flex flex-col items-center">
          {roomCode ? (
            <h2 className="fixed text-xl top-11">Room Code: {roomCode}</h2>
          ) : null}
          <div className="w-80 sm:w-96">
            <div className="m-1 grid grid-cols-[82.5%_17.5%]">
              <h2 className="text-xl sm:text-2xl">Username</h2>
              <h2 className="text-xl sm:text-2xl">Status</h2>
            </div>
          </div>
          <div className="w-80 sm:w-96">
            {joinedUsers.map((user) => (
              <div
                key={user.username}
                className="m-1 grid grid-cols-[82.5%_17.5%]"
              >
                <div className="p-0.5 text-xl sm:text-2xl border-2 border-solid border-black">
                  {user.username}
                </div>
                <div className="p-0.5 text-xl sm:text-2xl border-y-2 border-x-2 ml-0.5 border-black text-center">
                  {user.ready ? "Y" : "N"}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
