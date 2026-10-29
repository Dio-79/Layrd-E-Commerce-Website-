// Sign-up / login session flow: /api/auth/session, /api/auth/me, /api/auth/logout
import { beforeEach, describe, expect, it } from "vitest";
import { adminDb } from "@/lib/firebase/admin";
import { GET as me } from "@/app/api/auth/me/route";
import { POST as startSession } from "@/app/api/auth/session/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { request, resetEmulators, sessionCookie, signUp } from "./helpers";

beforeEach(resetEmulators);

describe("auth session", () => {
  it("is signed out without a session cookie", async () => {
    expect((await me(request("/api/auth/me"))).status).toBe(401);
  });

  it("rejects a missing or fake sign-in token", async () => {
    expect((await startSession(request("/api/auth/session", { method: "POST", body: {} }))).status).toBe(400);
    const fake = await startSession(request("/api/auth/session", { method: "POST", body: { idToken: "not-a-token" } }));
    expect(fake.status).toBe(401);
  });

  it("a new account gets a session, a profile and the customer role", async () => {
    const { idToken, uid } = await signUp("new.customer@layrd.test");
    const res = await startSession(
      request("/api/auth/session", { method: "POST", body: { idToken, name: "New Customer" } })
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toMatch(/layrd_session=.+HttpOnly/i);

    const body = await res.json();
    expect(body.user).toMatchObject({ id: uid, email: "new.customer@layrd.test", name: "New Customer", role: "customer" });

    const profile = await adminDb.collection("users").doc(uid).get();
    expect(profile.data()).toMatchObject({ role: "customer", name: "New Customer" });

    const meRes = await me(request("/api/auth/me", { cookie: sessionCookie(res) }));
    expect(meRes.status).toBe(200);
    expect(await meRes.json()).toMatchObject({ id: uid, role: "customer" });
  });

  it("the role comes from Firestore, not from the browser", async () => {
    const { idToken, uid } = await signUp("staff@layrd.test");
    const res = await startSession(request("/api/auth/session", { method: "POST", body: { idToken } }));
    await adminDb.collection("users").doc(uid).update({ role: "admin" });

    const meRes = await me(request("/api/auth/me", { cookie: sessionCookie(res) }));
    expect((await meRes.json()).role).toBe("admin");
  });

  it("a tampered session cookie is rejected", async () => {
    const meRes = await me(request("/api/auth/me", { cookie: "layrd_session=eyJhbGciOiJub25lIn0.e30." }));
    expect(meRes.status).toBe(401);
  });

  it("logout clears the session cookie", async () => {
    const res = await logout();
    expect(res.headers.get("set-cookie")).toMatch(/layrd_session=;.*Max-Age=0/i);
  });
});
