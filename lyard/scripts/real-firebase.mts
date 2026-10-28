// Shared setup for scripts that talk to the REAL Firebase project in .env.local
// (seed-real, make-admin, smoke-real). Refuses to run against the emulators.
import { readFileSync } from "node:fs";
import path from "node:path";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

if (process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  console.error("These scripts are for the real project; unset FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST.");
  process.exit(1);
}

const keyFile = process.env.FIREBASE_SERVICE_ACCOUNT_FILE;
if (!keyFile) {
  console.error("Set FIREBASE_SERVICE_ACCOUNT_FILE in .env.local (see FIREBASE.md).");
  process.exit(1);
}

const key = JSON.parse(readFileSync(path.resolve(process.cwd(), keyFile), "utf8"));
export const projectId: string = key.project_id;
export const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "";

const app = initializeApp({ projectId, credential: cert(key) });
export const auth = getAuth(app);
export const db = getFirestore(app);
db.settings({ ignoreUndefinedProperties: true });
