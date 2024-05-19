import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import sessionOptions from "../../../lib/session";
import { getLobby } from "../../../lib/redis";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const roomCode = formData.get("room_code");
  const username = formData.get("username");

  if (!roomCode || !username) {
    return NextResponse.json(
      { error: "Room code or username was not entered" },
      { status: 400 }
    );
  }

  const lobby = await getLobby(roomCode.toString());

  if (lobby) {
    if (lobby.gameState !== "create_selections") {
      return NextResponse.json(
        {
          error: "The room has already started",
          error_code: "ROOM_HAS_STARTED",
        },
        { status: 403 }
      );
    }

    if (lobby.users.find((user) => user.username === username)) {
      return NextResponse.json(
        {
          error: "The username is unavailable",
          error_code: "USERNAME_UNAVAILABLE",
        },
        { status: 403 }
      );
    }
  }

  const res = NextResponse.json({ roomCode });

  const session = await getIronSession(req, res, sessionOptions);
  session.roomCode = roomCode.toString();
  session.username = username.toString();
  await session.save();

  return res;
}
