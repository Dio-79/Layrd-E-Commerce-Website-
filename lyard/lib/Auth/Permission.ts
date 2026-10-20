// Types only. Each role file imports from here, and lib/roles.ts imports the
// role files, so keeping the types separate avoids a circular import.

export type Role = "guest" | "user" | "customer" | "wholesale" | "admin";

export type Permission =
  | "store:view" // browse products
  | "cart:use" // add to bag
  | "checkout:purchase" // pay for retail orders
  | "events:preorder" // custom event preorders
  | "account:manage" // profile, own order history
  | "wholesale:portal" // open the wholesale portal
  | "wholesale:order" // place wholesale orders
  | "wholesale:pricing" // see wholesale price list
  | "admin:portal" // open the admin portal
  | "stock:view"
  | "stock:edit"
  | "orders:viewAll"
  | "users:manage";

export interface RoleDefinition {
  role: Role;
  label: string;
  /** Where this role lands after signing in */
  home: string;
  permissions: readonly Permission[];
}