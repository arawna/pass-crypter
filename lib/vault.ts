import { v4 as uuid } from "uuid";
import { readDatabase, updateDatabase } from "./db";
import type { VaultEntry } from "./types";

export async function listEntries(userId: string) {
  const db = await readDatabase();
  return db.entries.filter((entry) => entry.userId === userId);
}

export async function createEntry(
  userId: string,
  data: Pick<VaultEntry, "platform" | "username" | "ciphertext" | "iv">
) {
  const entry: VaultEntry = {
    id: uuid(),
    userId,
    platform: data.platform,
    username: data.username,
    ciphertext: data.ciphertext,
    iv: data.iv,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await updateDatabase((db) => {
    db.entries.push(entry);
  });

  return entry;
}

export async function deleteEntry(userId: string, entryId: string) {
  let removed = false;
  await updateDatabase((db) => {
    const before = db.entries.length;
    db.entries = db.entries.filter((entry) => !(entry.userId === userId && entry.id === entryId));
    removed = before !== db.entries.length;
  });
  return removed;
}
