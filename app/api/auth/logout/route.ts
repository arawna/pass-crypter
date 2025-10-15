import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getTokenFromRequest } from "@/lib/api";
import { removeSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const token = await getTokenFromRequest(request);
    if (token) {
      await removeSession(token);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("sessionToken", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(0)
    });

    return response;
  } catch (error) {
    console.error("Logout error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
