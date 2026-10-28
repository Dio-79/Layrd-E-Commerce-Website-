// npx tsx --env-file=.env.local scripts/restore-products.mts <backup file>
// Puts products back from a backup made by scripts/remove-products.mts.
import { readFileSync } from "node:fs";
import { db, projectId } from "./real-firebase.mjs";

const file = process.argv[2];
if (!file) {
  console.error("Usage: scripts/restore-products.mts <backup file>");
  process.exit(1);
}

const products = JSON.parse(readFileSync(file, "utf8")) as Record<string, Record<string, unknown>>;
const batch = db.batch();
for (const [id, data] of Object.entries(products)) batch.set(db.collection("products").doc(id), data);
await batch.commit();
for (const [id, data] of Object.entries(products)) console.log(`  ✓ restored products/${id} (${data.name}) in ${projectId}`);
process.exit(0);
