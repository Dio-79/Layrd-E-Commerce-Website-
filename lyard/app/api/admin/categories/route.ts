// /api/admin/categories - product categories that can be hidden until a new
// product line is ready (FR-24). Firestore "categories", one document per name.
//   PUT { name, visible }   create a category or show/hide it
//   DELETE ?name=Merch      remove the category (its products stay)
// Categories with visible: false hide their products from the shop.
import { NextResponse, type NextRequest } from "next/server";
import { adminDb, COLLECTIONS } from "@/lib/firebase/admin";
import { readJson } from "@/lib/server/forms";
import { AdminError, adminFail, bool, requireAdmin, str } from "@/lib/server/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const docId = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = (await readJson(req)) ?? {};
    const name = str(body.name, 40) ?? "";
    if (name.length < 2 || !docId(name)) throw new AdminError("Give the category a name.");
    const visible = bool(body.visible) ?? false;
    const ref = adminDb.collection(COLLECTIONS.categories).doc(docId(name));
    const existing = (await ref.get()).data();
    await ref.set({ name, visible, createdAt: existing?.createdAt ?? new Date().toISOString(), updatedAt: new Date().toISOString() });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return adminFail(err, "save the category");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin(req);
    const name = req.nextUrl.searchParams.get("name") ?? "";
    if (!docId(name)) throw new AdminError("Which category?");
    await adminDb.collection(COLLECTIONS.categories).doc(docId(name)).delete();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return adminFail(err, "remove the category");
  }
}
