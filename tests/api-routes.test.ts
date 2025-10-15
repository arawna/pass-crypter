import { mkdtempSync, rmSync } from "fs";
import { writeFile } from "fs/promises";
import os from "os";
import path from "path";

const tempDir = mkdtempSync(path.join(os.tmpdir(), "cipher-api-tests-"));
const dbPath = path.join(tempDir, "db.json");
process.env.DB_FILE_PATH = dbPath;

const initialDb = {
  users: [],
  sessions: [],
  entries: []
};

const registerModule = await import("../app/api/auth/register/route");
const loginModule = await import("../app/api/auth/login/route");
const entriesModule = await import("../app/api/entries/route");
const entriesIdModule = await import("../app/api/entries/[id]/route");

const registerPost = registerModule.POST;
const loginPost = loginModule.POST;
const entriesGet = entriesModule.GET;
const entriesPost = entriesModule.POST;
const entriesDelete = entriesIdModule.DELETE;

type RequestOptions = {
  body?: any;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
};

function createRequest(options: RequestOptions = {}) {
  const headers = new Headers(options.headers ?? {});
  if (options.cookies) {
    const cookieHeader = Object.entries(options.cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join("; ");
    headers.set("cookie", cookieHeader);
  }
  if (options.body !== undefined && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const cookieStore = new Map(Object.entries(options.cookies ?? {}));

  const request: any = {
    method: options.body ? "POST" : "GET",
    headers,
    cookies: {
      get: (name: string) => {
        const value = cookieStore.get(name);
        return value ? { name, value } : undefined;
      }
    }
  };

  if (options.body !== undefined) {
    request.json = async () => options.body;
    request.body = JSON.stringify(options.body);
  } else {
    request.json = async () => {
      throw new Error("No body available");
    };
  }

  return request as any;
}

async function resetDatabase() {
  await writeFile(dbPath, JSON.stringify(initialDb, null, 2), "utf8");
}

async function registerUser(email: string, password: string, name = "Agent User") {
  const response = await registerPost(
    createRequest({
      body: {
        email,
        password,
        name
      }
    })
  );
  expect(response.status).toBe(201);
  return response;
}

async function loginUser(email: string, password: string) {
  const response = await loginPost(
    createRequest({
      body: {
        email,
        password
      }
    })
  );
  const payload = await response.json();
  const cookie = response.cookies.get("sessionToken");
  expect(cookie?.value).toBeDefined();
  return { response, payload, cookie };
}

beforeEach(async () => {
  await resetDatabase();
});

afterAll(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("Auth API routes", () => {
  it("registers a new user and prevents duplicates", async () => {
    const first = await registerUser("api-user@example.com", "Password!23");
    const firstBody = await first.json();
    expect(firstBody.user.email).toBe("api-user@example.com");

    const duplicate = await registerPost(
      createRequest({
        body: {
          email: "api-user@example.com",
          password: "Password!23",
          name: "Duplicate"
        }
      })
    );
    expect(duplicate.status).toBe(409);
  });

  it("logs in an existing user and issues a session token", async () => {
    await registerUser("login@example.com", "Password!23");
    const { payload, cookie } = await loginUser("login@example.com", "Password!23");

    expect(payload.token).toBeDefined();
    expect(cookie?.value).toHaveLength(96);
    expect(payload.user.email).toBe("login@example.com");
  });
});

describe("Entries API routes", () => {
  const email = "vault-api@example.com";
  const password = "Password!23";

  beforeEach(async () => {
    await registerUser(email, password);
  });

  it("rejects requests with invalid tokens", async () => {
    const response = await entriesGet(
      createRequest({
        headers: {
          authorization: "Bearer invalid"
        }
      }) as any
    );

    expect(response.status).toBe(401);
  });

  it("creates, lists, and deletes entries for authenticated users", async () => {
    const { payload } = await loginUser(email, password);
    const token = payload.token as string;

    const createResponse = await entriesPost(
      createRequest({
        headers: {
          authorization: `Bearer ${token}`
        },
        body: {
          platform: "Example",
          username: "user@example.com",
          ciphertext: "ciphertext==",
          iv: "iv=="
        }
      }) as any
    );
    expect(createResponse.status).toBe(201);
    const created = await createResponse.json();
    expect(created.entry.platform).toBe("Example");

    const listResponse = await entriesGet(
      createRequest({
        headers: {
          authorization: `Bearer ${token}`
        }
      }) as any
    );
    const listPayload = await listResponse.json();
    expect(listPayload.entries).toHaveLength(1);
    expect(listPayload.entries[0].platform).toBe("Example");

    const deleteResponse = await entriesDelete(
      createRequest({
        headers: {
          authorization: `Bearer ${token}`
        }
      }) as any,
      { params: { id: created.entry.id } }
    );
    expect(deleteResponse.status).toBe(200);
    const deletePayload = await deleteResponse.json();
    expect(deletePayload.success).toBe(true);
  });
});
