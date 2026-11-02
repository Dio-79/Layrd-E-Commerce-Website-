"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import type { Permission } from "@/lib/Auth/Permission";
import { loginUrl } from "@/lib/Routes/Routes";

/**
 * Page guard. Signed-out visitors go to /login (which says why, and comes back
 * here afterwards); signed-in users without the permission go to `fallback`
 * (by default their own home page, e.g. the shop for customers).
 * Nothing protected renders until the check passes.
 */
export function RequireRole({
  permission,
  children,
  fallback,
}: {
  permission: Permission;
  children: ReactNode;
  fallback?: string;
}) {
  const { user, loading, can, home } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const allowed = can(permission);

  useEffect(() => {
    if (loading || allowed) return;
    router.replace(user ? (fallback ?? home) : loginUrl(pathname, permission));
  }, [loading, allowed, user, router, fallback, home, pathname, permission]);

  if (loading || !allowed) return null;
  return <>{children}</>;
}

/** Inline guard: renders children only if allowed, otherwise `otherwise` (e.g. <GuestPrompt />). */
export function Can({
  permission,
  children,
  otherwise = null,
}: {
  permission: Permission;
  children: ReactNode;
  otherwise?: ReactNode;
}) {
  const { can } = useAuth();
  return <>{can(permission) ? children : otherwise}</>;
}