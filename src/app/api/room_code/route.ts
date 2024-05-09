import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import sessionOptions from "../../../lib/session";

export async function GET(req: NextRequest, res: NextResponse) {
  const session = await getIronSession(req, res, sessionOptions);

  if (!session.roomCode)
    return NextResponse.json(
      { error: "No room code found in the session cookie" },
      { status: 401 }
    );

  return NextResponse.json({ roomCode: session.roomCode.toString() });
}
