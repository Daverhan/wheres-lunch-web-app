import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import sessionOptions from "./lib/session";

export async function middleware(req: NextRequest, res: NextResponse) {
  const session = await getIronSession(req, res, sessionOptions);

  if (!session.roomCode || !session.username) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const pathName = req.nextUrl.pathname;
  const roomStatus = await getRoomStatus(req);

  if (roomStatus) {
    if (
      (pathName.includes("/lobby/create_selections") &&
        "finished" === roomStatus) ||
      (pathName.includes("/lobby/vote_selections") && "finished" === roomStatus)
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (
      (pathName.includes("/lobby/create_selections") &&
        "create_selections" !== roomStatus) ||
      (pathName.includes("/lobby/vote_selections") &&
        "vote_selections" !== roomStatus) ||
      (pathName.includes("/results") && "finished" !== roomStatus)
    ) {
      return NextResponse.redirect(new URL(`/lobby/${roomStatus}`, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/lobby/create_selections", "/lobby/vote_selections", "/results"],
};

async function getRoomStatus(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie");

  if (!cookieHeader) {
    throw new Error("No cookie header");
  }

  const response = await fetch(
    new URL("/api/room_status", req.nextUrl.origin),
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
    }
  );

  if (response.ok) {
    const responseJSON = await response.json();
    return responseJSON.roomStatus;
  }
}
