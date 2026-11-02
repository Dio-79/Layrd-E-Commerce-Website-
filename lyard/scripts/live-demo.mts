// npx tsx --env-file=.env.local scripts/live-demo.mts [seconds]
// Shows live updates on the REAL project through the running site. Open
// /live/products and /live/orders first, then run this. It:
//   1. raises product 1's price by $1, holds it, then puts it back;
//   2. places a throwaway order, marks it "ready", then deletes it and its account.
// Each step waits for the change to arrive on the site's live streams and prints
// how long that took. Everything is put back at the end, pass or fail.
import { apiKey, auth, db, projectId } from "./real-firebase.mjs";

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const HOLD_MS = Number(process.argv[2] ?? 15) * 1000;
const stamp = Date.now().toString(36).toUpperCase();
const email = `live-demo-${stamp.toLowerCase()}@layrd.test`;
const orderNumber = `LYD-LIVE${stamp}`;
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Doc = Record<string, unknown>;

/** Opens an SSE stream on the site; waitFor() resolves on the first snapshot that matches. */
async function openStream(path: string, cookie?: string) {
  const controller = new AbortController();
  const res = await fetch(`${BASE}${path}`, { headers: cookie ? { cookie } : {}, signal: controller.signal });
  if (!res.ok || !res.body) throw new Error(`GET ${path} -> ${res.status} (is the site running?)`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let latest: Doc[] = [];
  const waiters: { test: (docs: Doc[]) => boolean; resolve: () => void }[] = [];

  (async () => {
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) return;
        buffer += decoder.decode(value, { stream: true });
        let end;
        while ((end = buffer.indexOf("\n\n")) >= 0) {
          const block = buffer.slice(0, end);
          buffer = buffer.slice(end + 2);
          const data = block.split("\n").find((l) => l.startsWith("data: "));
          if (!block.includes("event: snapshot") || !data) continue;
          latest = JSON.parse(data.slice(6));
          for (const w of waiters.splice(0)) (w.test(latest) ? w.resolve : () => waiters.push(w))();
        }
      }
    } catch {
      /* closed */
    }
  })();

  return {
    waitFor(test: (docs: Doc[]) => boolean, ms = 15_000) {
      const started = Date.now();
      return new Promise<number>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("the change didn't arrive within 15s")), ms);
        const done = () => {
          clearTimeout(timer);
          resolve(Date.now() - started);
        };
        if (test(latest)) done();
        else waiters.push({ test, resolve: done });
      });
    },
    close: () => controller.abort(),
  };
}

console.log(`Live demo: ${projectId} via ${BASE}\n`);

// 1. Products
const productRef = db.collection("products").doc("1");
const product = (await productRef.get()).data();
if (!product) throw new Error("products/1 is missing");
const original = product.price as number;
const products = await openStream("/api/live/products");
const priceOf = (docs: Doc[]) => docs.find((p) => p.productID === 1)?.price;
try {
  await products.waitFor((docs) => docs.length > 0);
  await productRef.update({ price: original + 1 });
  const ms = await products.waitFor((docs) => priceOf(docs) === original + 1);
  console.log(`  ✓ ${product.name}: $${original} → $${original + 1} reached the site in ${ms} ms`);
  console.log(`    (holding ${HOLD_MS / 1000}s so you can see it on /live/products)`);
  await pause(HOLD_MS);
} finally {
  await productRef.update({ price: original });
}
const backMs = await products.waitFor((docs) => priceOf(docs) === original);
console.log(`  ✓ price put back to $${original} (${backMs} ms)`);
products.close();

// 2. Orders, under a throwaway customer account
let uid = "";
try {
  const signUp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: `Live-${stamp}-pass`, returnSecureToken: true }),
  });
  const account = await signUp.json();
  if (!signUp.ok) throw new Error(`sign-up failed: ${account.error?.message}`);
  uid = account.localId;

  // Sessions need a verified email: mark it verified, then sign in again for a fresh token.
  await auth.updateUser(uid, { emailVerified: true });
  const signIn = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: `Live-${stamp}-pass`, returnSecureToken: true }),
  });
  const { idToken } = await signIn.json();

  const session = await fetch(`${BASE}/api/auth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, name: "Live Demo" }),
  });
  const cookie = (session.headers.get("set-cookie") ?? "").split(";")[0];

  const orders = await openStream("/api/live/orders", cookie);
  await orders.waitFor(() => true);

  const placed = await fetch(`${BASE}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({
      orderNumber,
      placedAt: new Date().toISOString(),
      customer: { email, phone: "4035550100", fullName: "Live Demo (test order)" },
      delivery: { method: "pickup", pickupLocation: "Pickup at 123 St. NE" },
      lines: [{ id: "1", source: "bag", productId: 1, name: String(product.name), quantity: 2, unitPrice: original }],
      events: [],
      promoCode: null,
      totals: { subtotal: original * 2, total: original * 2 },
    }),
  });
  if (placed.status !== 201) throw new Error(`POST /api/orders -> ${placed.status}`);
  const has = (status: string) => (docs: Doc[]) => docs.some((o) => o.orderNumber === orderNumber && o.status === status);
  console.log(`  ✓ order ${orderNumber} reached the customer's live view in ${await orders.waitFor(has("placed"))} ms`);
  console.log(`    (holding ${HOLD_MS / 1000}s so you can see it on /live/orders as an admin)`);
  await pause(HOLD_MS);

  await db.collection("orders").doc(orderNumber).update({ status: "ready" });
  console.log(`  ✓ status "ready" reached the customer's live view in ${await orders.waitFor(has("ready"))} ms`);
  await pause(Math.min(HOLD_MS, 5000));
  orders.close();
} finally {
  await db.collection("orders").doc(orderNumber).delete().catch(() => undefined);
  if (uid) {
    await db.collection("users").doc(uid).delete().catch(() => undefined);
    await auth.deleteUser(uid).catch(() => undefined);
  }
  console.log("\n  (test order and account deleted)");
}
process.exit(0);
