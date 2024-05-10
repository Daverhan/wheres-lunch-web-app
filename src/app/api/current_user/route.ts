import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import sessionOptions from "../../../lib/session";

export async function GET(req: NextRequest, res: NextResponse) {
  const session = await getIronSession(req, res, sessionOptions);

  if (!session.roomCode || !session.username)
    return NextResponse.json(
      {
        error:
          "The room code or username was unable to be found in the session cookie",
      },
      { status: 401 }
    );

  return NextResponse.json({
    roomCode: session.roomCode.toString(),
    username: session.username.toString(),
  });
}
