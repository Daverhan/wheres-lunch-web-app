import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import sessionOptions from "../../../lib/session";
import { getLobby } from "../../../lib/redis";

const ROOM_CODE_MAX_LENGTH = 10;
const USERNAME_MAX_LENGTH = 20;

const isAlphanumeric = (input_str: string): boolean => {
  return /^[a-zA-Z0-9]*$/.test(input_str);
};

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const roomCode = formData.get("room_code");
  const username = formData.get("username");

  if (!roomCode || !username) {
    return NextResponse.json(
      {
        error: "Room code or username was not entered",
        error_code: "EMPTY_INPUT_FIELDS",
      },
      { status: 400 }
    );
  }

  if (
    !isAlphanumeric(roomCode.toString()) ||
    !isAlphanumeric(username.toString())
  ) {
    return NextResponse.json(
      {
        error: "Room code and username must consist of alphanumeric characters",
        error_code: "INVALID_INPUT_FIELDS",
      },
      { status: 400 }
    );
  }

  if (roomCode.toString().length > ROOM_CODE_MAX_LENGTH) {
    return NextResponse.json(
      {
        error: `Room code must be at most ${ROOM_CODE_MAX_LENGTH} characters`,
        error_code: "ROOM_CODE_TOO_LONG",
      },
      { status: 400 }
    );
  }

  if (username.toString().length > USERNAME_MAX_LENGTH) {
    return NextResponse.json(
      {
        error: `Username must be at most ${USERNAME_MAX_LENGTH} characters`,
        error_code: "USERNAME_TOO_LONG",
      },
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
