// Firestore security rules (firestore.rules): what the BROWSER may read or write
// directly. Calls the Firestore emulator's REST API as a signed-out visitor or
// as a signed-in user (the emulator accepts unsigned test tokens). The API
// routes use the Admin SDK and are tested separately.
import { beforeEach, describe, expect, it } from "vitest";
import { FIRESTORE, PROJECT_ID, resetEmulators } from "./helpers";

const DOCS = `${FIRESTORE}/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

/** An unsigned ID token for `uid`, which only the emulator accepts. */
function testToken(uid: string) {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  return `${b64({ alg: "none", typ: "JWT" })}.${b64({
    iss: `https://securetoken.google.com/${PROJECT_ID}`,
    aud: PROJECT_ID,
    sub: uid,
    user_id: uid,
    iat: now,
    exp: now + 3600,
    auth_time: now,
    firebase: { sign_in_provider: "password", identities: {} },
  })}.`;
}

type As = "owner" | "guest" | { uid: string };
const headers = (as: As): Record<string, string> =>
  as === "guest" ? {} : { Authorization: `Bearer ${as === "owner" ? "owner" : testToken(as.uid)}` };

const fields = (data: Record<string, string | number>) =>
  Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, typeof v === "number" ? { integerValue: String(v) } : { stringValue: v }])
  );

const read = (path: string, as: As) => fetch(`${DOCS}/${path}`, { headers: headers(as) });
const write = (path: string, data: Record<string, string | number>, as: As) =>
  fetch(`${DOCS}/${path}`, {
    method: "PATCH",
    headers: { ...headers(as), "Content-Type": "application/json" },
    body: JSON.stringify({ fields: fields(data) }),
  });
const remove = (path: string, as: As) => fetch(`${DOCS}/${path}`, { method: "DELETE", headers: headers(as) });

const alice = { uid: "alice" };

beforeEach(async () => {
  await resetEmulators();
  // Seed as "owner" (rules switched off), the way the server writes
  await write("products/1", { productID: 1, name: "Strawberry Matcha", price: 7 }, "owner");
  await write("users/alice", { email: "alice@layrd.test", role: "customer" }, "owner");
  await write("users/bob", { email: "bob@layrd.test", role: "customer" }, "owner");
  await write("orders/LYD-1", { userId: "alice", total: 10 }, "owner");
  await write("bundlePreorders/BN-1", { reference: "BN-1" }, "owner");
});

describe("products", () => {
  it("anyone, even signed out, can read the catalog", async () => {
    expect((await read("products/1", "guest")).status).toBe(200);
  });

  it("nobody can change products from the browser", async () => {
    expect((await write("products/1", { price: 0 }, "guest")).status).toBe(403);
    expect((await write("products/1", { price: 0 }, alice)).status).toBe(403);
    expect((await remove("products/1", alice)).status).toBe(403);
  });
});

describe("user profiles", () => {
  it("a signed-in user can read their own profile", async () => {
    expect((await read("users/alice", alice)).status).toBe(200);
  });

  it("a user cannot read someone else's profile", async () => {
    expect((await read("users/bob", alice)).status).toBe(403);
  });

  it("signed-out visitors cannot read profiles", async () => {
    expect((await read("users/alice", "guest")).status).toBe(403);
  });

  it("a user cannot make themselves an admin", async () => {
    expect((await write("users/alice", { email: "alice@layrd.test", role: "admin" }, alice)).status).toBe(403);
  });
});

describe("orders and preorders", () => {
  it("the browser cannot read orders, not even your own", async () => {
    expect((await read("orders/LYD-1", alice)).status).toBe(403);
    expect((await read("orders/LYD-1", "guest")).status).toBe(403);
  });

  it("the browser cannot create or change orders", async () => {
    expect((await write("orders/LYD-2", { userId: "alice", total: 0 }, alice)).status).toBe(403);
    expect((await write("bundlePreorders/BN-2", { reference: "BN-2" }, alice)).status).toBe(403);
  });

  it("preorders are not readable from the browser", async () => {
    expect((await read("bundlePreorders/BN-1", "guest")).status).toBe(403);
  });
});
