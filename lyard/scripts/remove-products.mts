// npx tsx --env-file=.env.local scripts/remove-products.mts 2 8
// Removes products from the REAL Firestore "products" collection. Each product is
// saved to a backup file first (outside the repo), so it can be put back with
// scripts/restore-products.mts <backup file>.
import { mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { db, projectId } from "./real-firebase.mjs";

const ids = process.argv.slice(2);
if (ids.length === 0) {
  console.error("Usage: scripts/remove-products.mts <productID> [<productID> ...]");
  process.exit(1);
}

const refs = ids.map((id) => db.collection("products").doc(id));
const snaps = await db.getAll(...refs);
const found = snaps.filter((s) => s.exists);
for (const s of snaps) if (!s.exists) console.log(`  - products/${s.id} doesn't exist (already removed?)`);
if (found.length === 0) process.exit(0);

const dir = path.join(os.homedir(), ".layrd", "backups");
mkdirSync(dir, { recursive: true });
const file = path.join(dir, `products-removed-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
writeFileSync(file, JSON.stringify(Object.fromEntries(found.map((s) => [s.id, s.data()])), null, 2));
console.log(`Backup of ${found.length} product(s) from ${projectId}: ${file}`);

const batch = db.batch();
for (const s of found) batch.delete(s.ref);
await batch.commit();
for (const s of found) console.log(`  ✓ removed products/${s.id} (${s.data()?.name})`);
process.exit(0);
