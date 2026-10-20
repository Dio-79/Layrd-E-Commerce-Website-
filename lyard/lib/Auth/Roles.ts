import type { Permission, Role, RoleDefinition } from "./Permission";
import { GUEST_ROLE } from "@/app/User/guest";
import { USER_ROLE } from "@/app/User/user";
import { CUSTOMER_ROLE } from "@/app/User/Customer";
import { WHOLESALE_ROLE } from "@/app/User/WholesSale/Wholesales";
import { ADMIN_ROLE } from "@/app/User/Admin/Adminstartor";

export const ROLES: Record<Role, RoleDefinition> = {
  guest: GUEST_ROLE,
  user: USER_ROLE,
  customer: CUSTOMER_ROLE,
  wholesale: WHOLESALE_ROLE,
  admin: ADMIN_ROLE,
};

export const isRole = (value: unknown): value is Role =>
  typeof value === "string" && value in ROLES;

/** Unknown or missing roles are treated as guest (least privilege). */
export const can = (role: Role | null | undefined, permission: Permission): boolean =>
  (ROLES[role ?? "guest"] ?? GUEST_ROLE).permissions.includes(permission);

export const homeFor = (role: Role | null | undefined): string =>
  (ROLES[role ?? "guest"] ?? GUEST_ROLE).home;