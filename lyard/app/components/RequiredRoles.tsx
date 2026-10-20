"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import type { Permission } from "@/lib/Auth/Permission";

/**
 * Page guard. Signed-out visitors go to /login, signed-in users without the
 * permission go to `fallback`. Nothing protected renders until the check passes.
 */
export function RequireRole({
  permission,
  children,
  fallback = "/",
}: {
  permission: Permission;
  children: ReactNode;
  fallback?: string;
}) {
  const { user, loading, can } = useAuth();
  const router = useRouter();
  const allowed = can(permission);

  useEffect(() => {
    if (loading || allowed) return;
    router.replace(user ? fallback : "/login");
  }, [loading, allowed, user, router, fallback]);

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