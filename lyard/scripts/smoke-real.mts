// npm run test:real
// Live smoke test against the REAL Firebase project and the running site
// (start it first with `npm run dev`). Uses a throwaway account and order,
// and deletes both at the end, pass or fail.
import { apiKey, auth, db, projectId } from "./real-firebase.mjs";

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const stamp = Date.now().toString(36).toUpperCase();
const email = `smoke-${stamp.toLowerCase()}@layrd.test`;
const orderNumber = `LYD-SMOKE${stamp}`;
let uid = "";
let failures = 0;

async function check(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failures++;
    console.log(`  ✗ ${name}\n      ${err instanceof Error ? err.message : err}`);
  }
}
function expect(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const firestoreRest = (path: string, token?: string) =>
  fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}?key=${apiKey}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

console.log(`Smoke test: ${projectId} via ${BASE}\n`);
let cookie = "";
let idToken = "";

try {
  await check("products are in Firestore", async () => {
    const snap = await db.collection("products").count().get();
    expect(snap.data().count > 0, "the products collection is empty; run npm run seed:real");
  });

  await check("the site serves those products (/api/products)", async () => {
    const res = await fetch(`${BASE}/api/products`);
    expect(res.ok, `GET /api/products -> ${res.status} (is npm run dev running?)`);
    const { products } = await res.json();
    expect(products.length > 0, "no products returned");
  });

  await check("Firebase Auth accepts a new email/password account", async () => {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: `Smoke-${stamp}-pass`, returnSecureToken: true }),
    });
    const data = await res.json();
    expect(res.ok, `sign-up failed: ${data.error?.message} (is Email/Password enabled?)`);
    idToken = data.idToken;
    uid = data.localId;
  });

  await check("the site starts a session and gives the customer role", async () => {
    const res = await fetch(`${BASE}/api/auth/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, name: "Smoke Test" }),
    });
    expect(res.ok, `POST /api/auth/session -> ${res.status}`);
    cookie = (res.headers.get("set-cookie") ?? "").split(";")[0];
    const me = await (await fetch(`${BASE}/api/auth/me`, { headers: { cookie } })).json();
    expect(me.role === "customer", `role was ${me.role}`);
  });

  await check("a checkout order is saved to Firestore under that user", async () => {
    const res = await fetch(`${BASE}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({
        orderNumber,
        placedAt: new Date().toISOString(),
        customer: { email, phone: "4035550100", fullName: "Smoke Test" },
        delivery: { method: "pickup", pickupLocation: "Pickup at 123 St. NE" },
        lines: [{ id: "1", source: "bag", productId: 1, name: "Strawberry Matcha", quantity: 1, unitPrice: 7 }],
        events: [],
        promoCode: null,
        totals: { subtotal: 7, total: 7.56 },
      }),
    });
    expect(res.status === 201, `POST /api/orders -> ${res.status}`);
    const saved = await db.collection("orders").doc(orderNumber).get();
    expect(saved.data()?.userId === uid, "order not linked to the user");
  });

  await check("deployed rules: anyone can read products", async () => {
    const res = await firestoreRest("products/1");
    expect(res.ok, `read products/1 -> ${res.status}`);
  });

  await check("deployed rules: the browser can't read orders, even its own", async () => {
    const res = await firestoreRest(`orders/${orderNumber}`, idToken);
    expect(res.status === 403, `read orders -> ${res.status}, expected 403`);
  });

  await check("deployed rules: a user can't make themselves admin", async () => {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}?key=${apiKey}&updateMask.fieldPaths=role`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ fields: { role: { stringValue: "admin" } } }),
      }
    );
    expect(res.status === 403, `write own role -> ${res.status}, expected 403`);
  });
} finally {
  await db.collection("orders").doc(orderNumber).delete().catch(() => undefined);
  if (uid) {
    await db.collection("users").doc(uid).delete().catch(() => undefined);
    await auth.deleteUser(uid).catch(() => undefined);
  }
  console.log("\n  (test account and order deleted)");
}

console.log(failures ? `\n${failures} check(s) failed.` : "\nAll live checks passed.");
process.exit(failures ? 1 : 0);
