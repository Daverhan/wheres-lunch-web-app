import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import sessionOptions from "../../../lib/session";
import { getLobby } from "../../../lib/redis";

export async function GET(req: NextRequest, res: NextResponse) {
  const session = await getIronSession(req, res, sessionOptions);
  const lobby = await getLobby(session.roomCode);

  if (!session.roomCode || !session.username) {
    return NextResponse.json(
      { error: "Invalid session cookie" },
      { status: 400 }
    );
  }

  return NextResponse.json({ roomStatus: lobby?.state });
}
