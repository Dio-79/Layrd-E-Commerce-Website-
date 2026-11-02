// Shared helpers for the emulator tests.
import { NextRequest } from "next/server";

export const PROJECT_ID = "demo-layrd-test";
export const FIRESTORE = "http://127.0.0.1:8085";
export const AUTH = "http://127.0.0.1:9199";

/** Wipes every document and every user in the test emulators. */
export async function resetEmulators() {
  await fetch(`${FIRESTORE}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`, { method: "DELETE" });
  await fetch(`${AUTH}/emulator/v1/projects/${PROJECT_ID}/accounts`, { method: "DELETE" });
}

async function identityToolkit(endpoint: string, body: unknown) {
  const res = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/${endpoint}?key=fake-api-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await res.json()) as { idToken?: string; localId?: string; error?: { message: string } };
}

/**
 * Creates a user in the Auth emulator the way the browser does; returns its ID token and uid.
 * By default the email is marked verified (as if they clicked the emailed link), and the
 * token is fresh, since a token records email_verified when it is issued.
 */
export async function signUp(email: string, password = "test-pass-123", displayName?: string, verified = true) {
  const data = await identityToolkit("accounts:signUp", { email, password, displayName, returnSecureToken: true });
  if (!data.idToken || !data.localId) throw new Error(`signUp failed: ${data.error?.message}`);
  if (!verified) return { idToken: data.idToken, uid: data.localId };

  const { adminAuth } = await import("@/lib/firebase/admin");
  await adminAuth.updateUser(data.localId, { emailVerified: true });
  const again = await identityToolkit("accounts:signInWithPassword", { email, password, returnSecureToken: true });
  if (!again.idToken) throw new Error(`signIn failed: ${again.error?.message}`);
  return { idToken: again.idToken, uid: data.localId };
}

/** Builds a NextRequest for calling a route handler directly. */
export function request(
  path: string,
  init: { method?: string; body?: unknown; cookie?: string; headers?: Record<string, string> } = {}
) {
  const headers: Record<string, string> = { ...init.headers };
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  if (init.cookie) headers.cookie = init.cookie;
  return new NextRequest(new URL(path, "http://localhost:3000"), {
    method: init.method ?? "GET",
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

/** "name=value" from a response's Set-Cookie header, for sending back on the next request. */
export function sessionCookie(res: Response): string {
  const raw = res.headers.get("set-cookie") ?? "";
  return raw.split(";")[0];
}

/** Signs up a user and starts a site session; returns the cookie to send with requests. */
export async function signedInUser(email: string, name = "Test User") {
  const { POST } = await import("@/app/api/auth/session/route");
  const { idToken, uid } = await signUp(email);
  const res = await POST(request("/api/auth/session", { method: "POST", body: { idToken, name } }));
  if (res.status !== 200) throw new Error(`session failed: ${res.status}`);
  return { uid, cookie: sessionCookie(res) };
}

/** A valid regular checkout order (what app/checkout/checkout.tsx sends). */
export function sampleOrder(orderNumber: string, email = "buyer@layrd.test") {
  return {
    orderNumber,
    placedAt: new Date().toISOString(),
    customer: { email, phone: "4035550100", fullName: "Test Buyer" },
    delivery: { method: "pickup", pickupLocation: "Pickup at 123 St. NE" },
    lines: [{ id: "1", source: "bag", productId: 1, name: "Strawberry Matcha", quantity: 2, unitPrice: 7 }],
    events: [],
    promoCode: null,
    totals: { subtotal: 14, discount: 0, shipping: 0, tax: 1.12, total: 15.12 },
  };
}
