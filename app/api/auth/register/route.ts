import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { createUser, getUserByEmail, hashPassword, toPublicUser } from "@/lib/auth";
import { registerSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await getUserByEmail(parsed.data.email);
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const encryptionSalt = randomBytes(16).toString("base64");

    const user = await createUser({
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash,
      encryptionSalt
    });

    return NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
  } catch (error) {
    console.error("Register error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
