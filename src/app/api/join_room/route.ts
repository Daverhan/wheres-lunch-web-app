import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import sessionOptions from "../../../lib/session";

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

  const res = NextResponse.json({ roomCode });

  const session = await getIronSession(req, res, sessionOptions);
  session.roomCode = roomCode.toString();
  session.username = username.toString();
  await session.save();

  return res;
}
