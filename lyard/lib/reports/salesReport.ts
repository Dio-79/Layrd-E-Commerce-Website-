// Sales and ingredient cost reports (MVP story 3). Pure functions, so the
// admin export route and the tests share one calculation.
//
// Revenue is what each line sold for (unit price x quantity). A wholesale
// order's tier discount is taken off its lines in proportion. Ingredient cost
// is the product's `ingredientCost` (set on /admin/editproduct) x units sold.

export interface ReportLine {
  productId?: number | string;
  name: string;
  quantity: number;
  unitPrice?: number;
}

export interface ReportOrder {
  id: string;
  orderNumber?: string;
  type?: string;
  status?: string;
  placedAt?: string;
  savedAt?: string;
  customer?: { email?: string; fullName?: string };
  lines?: ReportLine[];
  totals?: { subtotal?: number; discount?: number; tax?: number; shipping?: number; total?: number };
}

export interface ReportProduct {
  productID: number;
  name: string;
  price?: number;
  ingredientCost?: number;
}

export interface CostRow {
  productId: string;
  name: string;
  units: number;
  revenue: number;
  unitCost: number;
  ingredientCost: number;
  profit: number;
  /** Profit as a % of revenue; null when nothing sold */
  margin: number | null;
}

const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function orderDate(o: ReportOrder): string {
  return o.placedAt ?? o.savedAt ?? "";
}

/** Orders that count: not cancelled, and placed between from and to (YYYY-MM-DD, both included). */
export function ordersInRange(orders: ReportOrder[], from?: string, to?: string): ReportOrder[] {
  return orders.filter((o) => {
    if (o.status === "cancelled") return false;
    const day = orderDate(o).slice(0, 10);
    if (from && (!day || day < from)) return false;
    if (to && (!day || day > to)) return false;
    return true;
  });
}

/** Per-product units, revenue, ingredient cost, profit and margin. Biggest revenue first. */
export function costReport(orders: ReportOrder[], products: ReportProduct[]): CostRow[] {
  const catalog = new Map(products.map((p) => [String(p.productID), p]));
  const rows = new Map<string, CostRow>();

  for (const o of orders) {
    const lines = o.lines ?? [];
    const gross = lines.reduce((s, l) => s + (l.unitPrice ?? 0) * l.quantity, 0);
    // Share the order-level discount (wholesale tiers) across its lines
    const keep = gross > 0 && o.totals?.discount ? Math.max(0, 1 - o.totals.discount / gross) : 1;

    for (const l of lines) {
      const key = String(l.productId ?? l.name);
      const p = catalog.get(key);
      const unitCost = typeof p?.ingredientCost === "number" ? p.ingredientCost : 0;
      const row = rows.get(key) ?? { productId: key, name: p?.name ?? l.name, units: 0, revenue: 0, unitCost, ingredientCost: 0, profit: 0, margin: null };
      row.units += l.quantity;
      row.revenue += (l.unitPrice ?? p?.price ?? 0) * l.quantity * keep;
      rows.set(key, row);
    }
  }

  return [...rows.values()]
    .map((r) => {
      const revenue = round(r.revenue);
      const ingredientCost = round(r.unitCost * r.units);
      const profit = round(revenue - ingredientCost);
      return { ...r, revenue, ingredientCost, profit, margin: revenue > 0 ? round((profit / revenue) * 100) : null };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

export function reportTotals(rows: CostRow[]) {
  const revenue = round(rows.reduce((s, r) => s + r.revenue, 0));
  const ingredientCost = round(rows.reduce((s, r) => s + r.ingredientCost, 0));
  const profit = round(revenue - ingredientCost);
  return {
    units: rows.reduce((s, r) => s + r.units, 0),
    revenue,
    ingredientCost,
    profit,
    margin: revenue > 0 ? round((profit / revenue) * 100) : null,
    missingCost: rows.filter((r) => r.unitCost === 0).map((r) => r.name),
  };
}

/** One CSV cell: quoted when needed, and formulas defused so Excel won't run them. */
export function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(header: string[], rows: unknown[][]): string {
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

const fixed = (n: number | undefined) => (typeof n === "number" ? n.toFixed(2) : "");

/** Sales report: one row per order. */
export function salesCsv(orders: ReportOrder[]): string {
  const rows = [...orders]
    .sort((a, b) => orderDate(a).localeCompare(orderDate(b)))
    .map((o) => [
      orderDate(o).slice(0, 10),
      o.orderNumber ?? o.id,
      o.type === "wholesale" ? "Wholesale" : "Shop",
      o.status ?? "",
      o.customer?.fullName ?? "",
      o.customer?.email ?? "",
      (o.lines ?? []).reduce((s, l) => s + l.quantity, 0),
      fixed(o.totals?.subtotal),
      fixed(o.totals?.discount ?? 0),
      fixed(o.totals?.shipping ?? 0),
      fixed(o.totals?.tax),
      fixed(o.totals?.total),
    ]);
  const sum = (k: "subtotal" | "discount" | "shipping" | "tax" | "total") => round(orders.reduce((s, o) => s + (o.totals?.[k] ?? 0), 0)).toFixed(2);
  rows.push(["TOTAL", `${orders.length} orders`, "", "", "", "", orders.reduce((s, o) => s + (o.lines ?? []).reduce((t, l) => t + l.quantity, 0), 0), sum("subtotal"), sum("discount"), sum("shipping"), sum("tax"), sum("total")]);
  return toCsv(["Date", "Order", "Type", "Status", "Customer", "Email", "Units", "Subtotal", "Discount", "Shipping", "Tax", "Total"], rows);
}

/** Ingredient cost report: one row per product, with profit and margin. */
export function costCsv(rows: CostRow[]): string {
  const t = reportTotals(rows);
  const body: unknown[][] = rows.map((r) => [r.productId, r.name, r.units, r.revenue.toFixed(2), r.unitCost.toFixed(2), r.ingredientCost.toFixed(2), r.profit.toFixed(2), r.margin === null ? "" : `${r.margin.toFixed(1)}%`]);
  body.push(["TOTAL", "", t.units, t.revenue.toFixed(2), "", t.ingredientCost.toFixed(2), t.profit.toFixed(2), t.margin === null ? "" : `${t.margin.toFixed(1)}%`]);
  return toCsv(["Product ID", "Product", "Units Sold", "Revenue (after discounts)", "Ingredient Cost / Unit", "Ingredient Cost", "Gross Profit", "Margin"], body);
}
