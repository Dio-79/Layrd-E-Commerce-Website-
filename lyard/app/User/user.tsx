import type { RoleDefinition } from "@/lib/Auth/Permission";

// A signed-in account that has not been given a buying role yet
// (for example, email not verified). It can manage its account and browse,
// but cannot purchase. Promote to "customer" once verified.
export const USER_ROLE: RoleDefinition = {
  role: "user",
  label: "User",
  home: "/account",
  permissions: ["store:view", "account:manage"],
};