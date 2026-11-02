// Live updates: /api/live/products and /api/live/orders stream Firestore changes
// as Server-Sent Events, with the same access rules as /api/orders.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { GET as liveProducts } from "@/app/api/live/products/route";
import { GET as liveOrders } from "@/app/api/live/orders/route";
import { POST as placeOrder } from "@/app/api/orders/route";
import { request, resetEmulators, sampleOrder, signedInUser } from "./helpers";

beforeEach(resetEmulators);

const open: AbortController[] = [];
afterEach(() => open.splice(0).forEach((c) => c.abort()));

/** A GET request the test can disconnect, like a browser closing the tab. */
function streamRequest(path: string, cookie?: string) {
  const controller = new AbortController();
  open.push(controller);
  return new NextRequest(new URL(path, "http://localhost:3000"), {
    headers: cookie ? { cookie } : {},
    signal: controller.signal,
  });
}

/** Reads "snapshot" events from an SSE response, one at a time. */
function snapshots(res: Response) {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  return async function next<T = Record<string, unknown>>(): Promise<T[]> {
    for (;;) {
      const end = buffer.indexOf("\n\n");
      if (end >= 0) {
        const block = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        const data = block.split("\n").find((l) => l.startsWith("data: "));
        if (block.includes("event: snapshot") && data) return JSON.parse(data.slice(6)) as T[];
        continue;
      }
      const { value, done } = await reader.read();
      if (done) throw new Error("the stream ended");
      buffer += decoder.decode(value, { stream: true });
    }
  };
}

const numbers = (orders: { orderNumber: string }[]) => orders.map((o) => o.orderNumber).sort();
const place = (orderNumber: string, cookie?: string) =>
  placeOrder(request("/api/orders", { method: "POST", body: sampleOrder(orderNumber), cookie }));

describe("live products", () => {
  it("sends the catalog, then each change as it happens", async () => {
    const products = adminDb.collection("products");
    await products.doc("1").set({ productID: 1, name: "Strawberry Matcha", price: 9 });
    await products.doc("2").set({ productID: 2, name: "Hojicha Latte", price: 7 });

    const res = liveProducts(streamRequest("/api/live/products"));
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    const next = snapshots(res);

    const first = await next<{ name: string; price: number }>();
    expect(first.map((p) => p.name)).toEqual(["Strawberry Matcha", "Hojicha Latte"]);

    await products.doc("1").update({ price: 11 });
    const second = await next<{ productID: number; price: number }>();
    expect(second.find((p) => p.productID === 1)?.price).toBe(11);

    await products.doc("3").set({ productID: 3, name: "Ube Latte", price: 8 });
    expect(await next()).toHaveLength(3);
  });
});

describe("live orders", () => {
  it("needs a signed-in user", async () => {
    expect((await liveOrders(streamRequest("/api/live/orders"))).status).toBe(401);
  });

  it("customers only get their own orders, including new ones and status changes", async () => {
    const alice = await signedInUser("alice@layrd.test");
    const bob = await signedInUser("bob@layrd.test");
    await place("LYD-A1", alice.cookie);
    await place("LYD-B1", bob.cookie);

    const next = snapshots(await liveOrders(streamRequest("/api/live/orders", alice.cookie)));
    expect(numbers(await next())).toEqual(["LYD-A1"]);

    await place("LYD-A2", alice.cookie);
    expect(numbers(await next())).toEqual(["LYD-A1", "LYD-A2"]);

    await adminDb.collection("orders").doc("LYD-A1").update({ status: "ready" });
    const updated = await next<{ orderNumber: string; status: string }>();
    expect(updated.find((o) => o.orderNumber === "LYD-A1")?.status).toBe("ready");
  });

  it("admins get every order as it comes in", async () => {
    const admin = await signedInUser("admin@layrd.test");
    await adminDb.collection("users").doc(admin.uid).update({ role: "admin" });
    const alice = await signedInUser("alice@layrd.test");
    await place("LYD-A1", alice.cookie);

    const next = snapshots(await liveOrders(streamRequest("/api/live/orders", admin.cookie)));
    expect(numbers(await next())).toEqual(["LYD-A1"]);

    await place("LYD-A2", alice.cookie);
    expect(numbers(await next())).toEqual(["LYD-A1", "LYD-A2"]);
  });
});
