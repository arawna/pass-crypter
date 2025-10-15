import { promises as fs } from "fs";
import path from "path";
import type { Database } from "./types";

let mutex: Promise<void> = Promise.resolve();

function getDbFilePath() {
  const override = process.env.DB_FILE_PATH;
  if (override) {
    return path.resolve(override);
  }
  return path.join(process.cwd(), "data", "db.json");
}

async function ensureDatabaseFile(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    const initial: Database = { users: [], sessions: [], entries: [] };
    await fs.writeFile(filePath, JSON.stringify(initial, null, 2), "utf8");
  }
}

export async function readDatabase(): Promise<Database> {
  const filePath = getDbFilePath();
  await ensureDatabaseFile(filePath);
  const file = await fs.readFile(filePath, "utf8");
  return JSON.parse(file) as Database;
}

export async function writeDatabase(database: Database) {
  const filePath = getDbFilePath();
  await ensureDatabaseFile(filePath);
  await fs.writeFile(filePath, JSON.stringify(database, null, 2), "utf8");
}

function createMutex() {
  let release: (() => void) | undefined;
  const wait = new Promise<void>((resolve) => {
    release = resolve;
  });
  const previous = mutex;
  mutex = (async () => {
    await previous;
    await wait;
  })();
  return () => {
    release?.();
  };
}

export async function updateDatabase<T>(updater: (db: Database) => T | Promise<T>): Promise<T> {
  const release = createMutex();
  try {
    const db = await readDatabase();
    const result = await updater(db);
    await writeDatabase(db);
    return result;
  } finally {
    release();
  }
}
