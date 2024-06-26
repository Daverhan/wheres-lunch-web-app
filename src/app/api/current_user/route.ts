import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import sessionOptions from "../../../lib/session";

export async function GET(req: NextRequest, res: NextResponse) {
  const session = await getIronSession(req, res, sessionOptions);

  if (!session.roomCode || !session.username) {
    return NextResponse.json(
      { error: "Invalid session cookie" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    roomCode: session.roomCode.toString(),
    username: session.username.toString(),
  });
}
