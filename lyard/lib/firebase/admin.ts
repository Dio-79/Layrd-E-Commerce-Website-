// Firebase Admin SDK for API routes (server only).
//
// Emulators (npm run dev:firebase, npm test): FIRESTORE_EMULATOR_HOST and
// FIREBASE_AUTH_EMULATOR_HOST are set, so no credentials are needed.
// Real project (npm run dev): set FIREBASE_SERVICE_ACCOUNT_FILE in .env.local
// to the service-account JSON downloaded from the Firebase console.
import { readFileSync } from "node:fs";
import path from "node:path";
import { cert, getApps, initializeApp, type AppOptions } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

const projectId =
  process.env.GCLOUD_PROJECT ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "demo-layrd";

const usingEmulators = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

function options(): AppOptions {
  const file = process.env.FIREBASE_SERVICE_ACCOUNT_FILE;
  if (usingEmulators || !file) return { projectId };
  const key = JSON.parse(readFileSync(path.resolve(process.cwd(), file), "utf8"));
  return { projectId: key.project_id ?? projectId, credential: cert(key) };
}

const app = getApps()[0] ?? initializeApp(options());

export const adminAuth = getAuth(app);

const globalForDb = globalThis as unknown as { layrdDb?: Firestore };
export const adminDb: Firestore =
  globalForDb.layrdDb ??
  (() => {
    const db = getFirestore(app);
    // Order records carry optional fields; skip them instead of failing
    db.settings({ ignoreUndefinedProperties: true });
    globalForDb.layrdDb = db;
    return db;
  })();

/** Collection names in one place */
export const COLLECTIONS = {
  products: "products",
  users: "users",
  orders: "orders",
  bundlePreorders: "bundlePreorders",
  eventPreorders: "eventPreorders",
} as const;
