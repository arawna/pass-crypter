import { mkdtempSync, rmSync } from "fs";
import { writeFile } from "fs/promises";
import os from "os";
import path from "path";

const tempDir = mkdtempSync(path.join(os.tmpdir(), "cipher-tests-"));
const dbPath = path.join(tempDir, "db.json");
process.env.DB_FILE_PATH = dbPath;

const initialDb = {
  users: [],
  sessions: [],
  entries: []
};

const dbModule = await import("../lib/db");
const authModule = await import("../lib/auth");
const vaultModule = await import("../lib/vault");

const { readDatabase } = dbModule;
const {
  hashPassword,
  verifyPassword,
  createUser,
  getUserByEmail,
  createSession,
  getSession,
  removeSession
} = authModule;
const { createEntry, listEntries, deleteEntry } = vaultModule;

async function resetDatabase() {
  await writeFile(dbPath, JSON.stringify(initialDb, null, 2), "utf8");
}

beforeEach(async () => {
  await resetDatabase();
});

afterAll(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("Authentication helpers", () => {
  it("hashes and verifies passwords correctly", async () => {
    const password = "SuperSecret123!";
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash).toMatch(/^\$2[aby]\$/);
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("creates users with normalized emails", async () => {
    const hash = await hashPassword("Password!23");
    const user = await createUser({
      email: "User@Example.com",
      name: "Test User",
      passwordHash: hash,
      encryptionSalt: "salt=="
    });

    expect(user.email).toBe("user@example.com");
    expect(user.name).toBe("Test User");

    const fetched = await getUserByEmail("USER@example.com");
    expect(fetched?.id).toBe(user.id);

    const dbContent = await readDatabase();
    expect(dbContent.users).toHaveLength(1);
  });

  it("manages session lifecycle", async () => {
    const hash = await hashPassword("Password!23");
    const user = await createUser({
      email: "session@example.com",
      name: "Session User",
      passwordHash: hash,
      encryptionSalt: "salt=="
    });

    const { token } = await createSession(user.id);
    const session = await getSession(token);

    expect(session).not.toBeNull();
    expect(session?.userId).toBe(user.id);

    await removeSession(token);
    const removed = await getSession(token);
    expect(removed).toBeNull();
  });
});

describe("Vault entry helpers", () => {
  it("stores, lists, and deletes entries per user", async () => {
    const hash = await hashPassword("VaultPass123$");
    const user = await createUser({
      email: "vault@example.com",
      name: "Vault User",
      passwordHash: hash,
      encryptionSalt: "salt=="
    });
    const otherUser = await createUser({
      email: "other@example.com",
      name: "Other User",
      passwordHash: hash,
      encryptionSalt: "salt=="
    });

    const entry = await createEntry(user.id, {
      platform: "Example",
      username: "vault@example.com",
      ciphertext: "cipher",
      iv: "iv"
    });
    await createEntry(otherUser.id, {
      platform: "Hidden",
      username: "hidden@example.com",
      ciphertext: "cipher2",
      iv: "iv2"
    });

    const entries = await listEntries(user.id);
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe(entry.id);

    const deleted = await deleteEntry(user.id, entry.id);
    expect(deleted).toBe(true);
    expect(await listEntries(user.id)).toHaveLength(0);
  });
});
