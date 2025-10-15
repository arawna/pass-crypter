import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/api";
import { createEntry, listEntries } from "@/lib/vault";
import { credentialSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const entries = await listEntries(auth.user.id);
    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Entries GET error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = credentialSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }

    const entry = await createEntry(auth.user.id, parsed.data);
    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error("Entries POST error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
