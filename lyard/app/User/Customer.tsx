import type { RoleDefinition } from "@/lib/Auth/Permission";

// Retail customer: signs in, fills the bag, buys, and can preorder custom event orders.
export const CUSTOMER_ROLE: RoleDefinition = {
  role: "customer",
  label: "Customer",
  home: "/",
  permissions: [
    "store:view",
    "cart:use",
    "checkout:purchase",
    "events:preorder",
    "account:manage",
  ],
};