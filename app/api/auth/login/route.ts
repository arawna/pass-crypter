import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSession, getUserByEmail, toPublicUser, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";

const ONE_DAY_SECONDS = 60 * 60 * 24;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }

    const user = await getUserByEmail(parsed.data.email);
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const session = await createSession(user.id);
    const response = NextResponse.json({
      token: session.token,
      user: toPublicUser(user),
      encryptionSalt: user.encryptionSalt,
      expiresAt: session.expiresAt.toISOString()
    });

    response.cookies.set("sessionToken", session.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ONE_DAY_SECONDS
    });

    return response;
  } catch (error) {
    console.error("Login error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
