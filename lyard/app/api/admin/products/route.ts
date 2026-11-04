// /api/admin/products - admins manage the catalog in Firestore "products" (FR-13).
//   POST   { name, price, ... }            add a product (gets the next productID)
//   PATCH  { productID, ...fields }        change a product; only the fields sent
//   DELETE ?id=12                          remove a product from the storefront
// Hiding a product (hidden: true) keeps it in Firestore but out of the shop.
import { NextResponse, type NextRequest } from "next/server";
import { adminDb, COLLECTIONS } from "@/lib/firebase/admin";
import { readJson } from "@/lib/server/forms";
import { AdminError, adminFail, bool, date, defined, num, requireAdmin, str, strList } from "@/lib/server/admin";
import { CATEGORIES, getPriceRangeId } from "@/lib/catelog/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SHELF = ["Shelf Stable", "Refrigeration Required"];

/** The editable fields, checked. Anything invalid is left out (so it isn't changed). */
function fields(body: Record<string, unknown>) {
  const price = num(body.price, 0, 10_000);
  const category = str(body.category, 40);
  const shelf = str(body.shelf, 40);
  return defined({
    name: str(body.name, 80) || undefined,
    description: str(body.description, 2000),
    price,
    priceRange: price === undefined ? undefined : getPriceRangeId(price),
    tag: str(body.tag, 30),
    imageUrl: str(body.imageUrl, 300),
    categories: category && (CATEGORIES as readonly string[]).includes(category) ? [category] : strList(body.categories, 5),
    flavors: strList(body.flavors, 10),
    allergens: strList(body.allergens, 15),
    tags: strList(body.tags, 15),
    sweetness: num(body.sweetness, 1, 5),
    shelf: shelf && SHELF.includes(shelf) ? shelf : undefined,
    stock: num(body.stock, 0, 1_000_000),
    lowStockAt: num(body.lowStockAt, 0, 1_000_000),
    trackStock: bool(body.trackStock),
    hidden: bool(body.hidden),
    featured: bool(body.featured),
    limited: bool(body.limited),
    limitedUntil: date(body.limitedUntil),
    compareAt: num(body.compareAt, 0, 10_000),
    contents: contents(body.contents),
  });
}

/** What's inside a bundle: up to 12 products with a quantity each. */
function contents(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  return value
    .map((v) => ({
      productID: num((v as Record<string, unknown>)?.productID, 1, 1_000_000),
      name: str((v as Record<string, unknown>)?.name, 80) ?? "",
      quantity: Math.floor(num((v as Record<string, unknown>)?.quantity, 1, 99) ?? 1),
    }))
    .filter((v): v is { productID: number; name: string; quantity: number } => v.productID !== undefined)
    .slice(0, 12);
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await readJson(req);
    const data = fields(body ?? {});
    if (!data.name) throw new AdminError("Give the product a name.");
    if (data.price === undefined) throw new AdminError("Enter a price.");

    const col = adminDb.collection(COLLECTIONS.products);
    const productID = await adminDb.runTransaction(async (tx) => {
      const last = await tx.get(col.orderBy("productID", "desc").limit(1));
      const next = Number(last.docs[0]?.data().productID ?? 0) + 1;
      tx.create(col.doc(String(next)), {
        productID: next,
        section: "cake-in-a-can",
        categories: ["Cakes"],
        sizes: [],
        flavors: [],
        tag: "",
        description: "",
        imageUrl: "",
        ...data,
        createdAt: new Date().toISOString(),
      });
      return next;
    });
    return NextResponse.json({ productID }, { status: 201 });
  } catch (err) {
    return adminFail(err, "add the product");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await readJson(req);
    const productID = num(body?.productID, 1, 1_000_000);
    if (!productID) throw new AdminError("Which product?");
    const data = fields(body ?? {});
    if (Object.keys(data).length === 0) throw new AdminError("Nothing to change.");

    const ref = adminDb.collection(COLLECTIONS.products).doc(String(productID));
    if (!(await ref.get()).exists) throw new AdminError("That product isn't in Firestore.", 404);
    await ref.set({ ...data, updatedAt: new Date().toISOString() }, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return adminFail(err, "save the product");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin(req);
    const productID = num(req.nextUrl.searchParams.get("id"), 1, 1_000_000);
    if (!productID) throw new AdminError("Which product?");
    await adminDb.collection(COLLECTIONS.products).doc(String(productID)).delete();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return adminFail(err, "remove the product");
  }
}
