import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/api";
import { deleteEntry } from "@/lib/vault";

type Params = {
  params: {
    id: string;
  };
};

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const removed = await deleteEntry(auth.user.id, params.id);
    if (!removed) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Entries DELETE error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
