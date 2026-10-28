// Live updates as Server-Sent Events. The server listens to Firestore with the
// Admin SDK (onSnapshot) and pushes every change to the page, so the browser
// needs no Firebase package and the security rules stay as they are.
import type { Query } from "firebase-admin/firestore";

const HEARTBEAT_MS = 25_000; // keeps proxies from closing a quiet connection

export const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
} as const;

/**
 * Streams a Firestore query: one "snapshot" event with every document now,
 * and again after each change. Stops listening when the browser disconnects.
 */
export function streamQuery(signal: AbortSignal, query: Query, event = "snapshot") {
  const encoder = new TextEncoder();
  let stop = () => {};

  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (text: string) => {
        try {
          controller.enqueue(encoder.encode(text));
        } catch {
          stop(); // the stream was already closed
        }
      };

      const unsubscribe = query.onSnapshot(
        (snap) => {
          const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          send(`event: ${event}\ndata: ${JSON.stringify(docs)}\n\n`);
        },
        (err) => {
          console.error("live stream failed:", err);
          send(`event: failed\ndata: ${JSON.stringify("Lost the connection to Firebase.")}\n\n`);
          stop();
        }
      );
      const heartbeat = setInterval(() => send(": ping\n\n"), HEARTBEAT_MS);

      let stopped = false;
      stop = () => {
        if (stopped) return;
        stopped = true;
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };
      if (signal.aborted) stop();
      else signal.addEventListener("abort", stop, { once: true });
    },
    cancel() {
      stop();
    },
  });

  return new Response(body, { headers: SSE_HEADERS });
}
