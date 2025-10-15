import bcrypt from "bcryptjs";
import crypto from "crypto";
import { v4 as uuid } from "uuid";
import { readDatabase, updateDatabase } from "./db";
import type { PublicUser, Session, User } from "./types";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

export async function hashPassword(password: string) {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

function createSessionToken() {
  return crypto.randomBytes(48).toString("hex");
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const rawToken = createSessionToken();
  const hashedToken = hashToken(rawToken);
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + SESSION_TTL_MS);

  await updateDatabase((db) => {
    db.sessions = db.sessions.filter((session) => session.userId !== userId);
    db.sessions.push({
      token: hashedToken,
      userId,
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString()
    });
  });

  return {
    token: rawToken,
    expiresAt
  };
}

export async function removeSession(token: string) {
  const hashed = hashToken(token);
  await updateDatabase((db) => {
    db.sessions = db.sessions.filter((session) => session.token !== hashed);
  });
}

export async function getSession(token: string): Promise<Session | null> {
  const hashed = hashToken(token);
  const db = await readDatabase();
  const session = db.sessions.find((item) => item.token === hashed);
  if (!session) {
    return null;
  }

  const isExpired = new Date(session.expiresAt).getTime() <= Date.now();
  if (isExpired) {
    await updateDatabase((draft) => {
      draft.sessions = draft.sessions.filter((item) => item.token !== hashed);
    });
    return null;
  }
  return session;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await readDatabase();
  return db.users.find((user) => user.email === email.toLowerCase()) ?? null;
}

export async function getUserById(userId: string): Promise<User | null> {
  const db = await readDatabase();
  return db.users.find((user) => user.id === userId) ?? null;
}

export async function createUser(params: { email: string; name: string; passwordHash: string; encryptionSalt: string }) {
  const user: User = {
    id: uuid(),
    email: params.email.toLowerCase(),
    name: params.name,
    passwordHash: params.passwordHash,
    encryptionSalt: params.encryptionSalt,
    createdAt: new Date().toISOString()
  };

  await updateDatabase((db) => {
    db.users.push(user);
  });

  return user;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name
  };
}
