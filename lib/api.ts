import type { NextRequest } from "next/server";
import { getSession, getUserById } from "./auth";

export async function getTokenFromRequest(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    return authorization.substring("Bearer ".length).trim();
  }
  const tokenCookie = request.cookies.get("sessionToken");
  return tokenCookie?.value ?? null;
}

export async function authenticateRequest(request: NextRequest) {
  const token = await getTokenFromRequest(request);
  if (!token) {
    return null;
  }
  const session = await getSession(token);
  if (!session) {
    return null;
  }
  const user = await getUserById(session.userId);
  if (!user) {
    return null;
  }
  return { token, session, user };
}
