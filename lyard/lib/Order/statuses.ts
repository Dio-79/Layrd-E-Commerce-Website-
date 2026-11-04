// Shop order statuses, shared by the admin Orders page and the customer's
// "My orders" page (FR-9, FR-15).
export const ORDER_STATUSES = ["placed", "processing", "ready", "out_for_delivery", "delivered", "picked_up", "cancelled"] as const;
export type ShopOrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABELS: Record<string, string> = {
  placed: "Order placed",
  processing: "Being made",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  picked_up: "Picked up",
  cancelled: "Cancelled",
  // bundle / event preorders
  requested: "Requested",
  confirmed: "Confirmed",
  in_production: "In production",
};

/** The steps a customer sees, for delivery or pickup. */
export function trackingSteps(delivery: boolean): ShopOrderStatus[] {
  return delivery ? ["placed", "processing", "out_for_delivery", "delivered"] : ["placed", "processing", "ready", "picked_up"];
}

export const statusLabel = (s?: string) => (s ? (STATUS_LABELS[s] ?? s.replace(/_/g, " ")) : "—");
