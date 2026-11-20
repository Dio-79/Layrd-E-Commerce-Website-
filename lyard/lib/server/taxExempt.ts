// Is this wholesale buyer tax exempt right now? (MVP story 8)
import { adminDb, COLLECTIONS } from "@/lib/firebase/admin";

export async function isTaxExempt(userId: string): Promise<boolean> {
  const t = (await adminDb.collection(COLLECTIONS.users).doc(userId).get()).data()?.taxExemption;
  if (t?.status !== "approved") return false;
  return !t.expiresOn || String(t.expiresOn) >= new Date().toISOString().slice(0, 10);
}
