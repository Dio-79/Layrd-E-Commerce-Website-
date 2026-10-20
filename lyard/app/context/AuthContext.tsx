"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { can as roleCan, isRole } from "@/lib/Auth/Roles";
import type { Permission, Role } from "@/lib/Auth/Permission";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: Role;
}

interface AuthValue {
  user: AuthUser | null;
  role: Role; // "guest" when signed out
  loading: boolean;
  can: (permission: Permission) => boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

/**
 * Loads the signed-in user from GET /api/auth/me, which must return
 * { id, email, name?, role } or a 401. Swap the fetch for Firebase/NextAuth/etc.
 * if that is what you use. The role must come from your server, never from
 * something the browser can edit (localStorage, a cookie it can write).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) {
        setUser(null);
        return;
      }

      const data = await res.json();
      setUser(isRole(data?.role) ? { ...data, role: data.role } : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) {
          if (!cancelled) setUser(null);
          return;
        }

        const data = await res.json();
        if (!cancelled) {
          setUser(isRole(data?.role) ? { ...data, role: data.role } : null);
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  const role: Role = user?.role ?? "guest";
  const value = useMemo<AuthValue>(
    () => ({ user, role, loading, refresh, can: (p) => roleCan(role, p) }),
    [user, role, loading, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}