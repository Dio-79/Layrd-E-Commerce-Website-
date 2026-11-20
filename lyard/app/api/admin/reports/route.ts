// GET /api/admin/reports - admins export sales and ingredient cost reports (MVP story 3).
//   ?type=sales&from=YYYY-MM-DD&to=YYYY-MM-DD       CSV, one row per order
//   ?type=costs&from=...&to=...                     CSV, one row per product with cost, profit, margin
//   ?type=summary&from=...&to=...                   JSON totals for the Analytics page
// Shop and wholesale orders from "orders"; cancelled orders are left out.
import { NextResponse, type NextRequest } from "next/server";
import { adminDb, COLLECTIONS } from "@/lib/firebase/admin";
import { AdminError, adminFail, date, requireAdmin } from "@/lib/server/admin";
import { costCsv, costReport, ordersInRange, reportTotals, salesCsv, type ReportOrder, type ReportProduct } from "@/lib/reports/salesReport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const q = req.nextUrl.searchParams;
    const type = q.get("type") ?? "summary";
    if (!["sales", "costs", "summary"].includes(type)) throw new AdminError("Choose a sales, costs or summary report.");
    const from = date(q.get("from") ?? "");
    const to = date(q.get("to") ?? "");
    if (from === undefined || to === undefined) throw new AdminError("Dates must look like 2026-11-20.");
    if (from && to && from > to) throw new AdminError("The start date is after the end date.");

    const [orderSnap, productSnap] = await Promise.all([
      adminDb.collection(COLLECTIONS.orders).get(),
      adminDb.collection(COLLECTIONS.products).get(),
    ]);
    const orders = ordersInRange(orderSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as ReportOrder), from, to);
    const products = productSnap.docs.map((d) => d.data() as ReportProduct);
    const rows = costReport(orders, products);

    if (type === "summary") return NextResponse.json({ orders: orders.length, rows, totals: reportTotals(rows) });

    const csv = type === "sales" ? salesCsv(orders) : costCsv(rows);
    const span = from || to ? `${from || "start"}_to_${to || "today"}` : "all-time";
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="layrd-${type === "sales" ? "sales" : "ingredient-costs"}-${span}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return adminFail(err, "build the report");
  }
}
