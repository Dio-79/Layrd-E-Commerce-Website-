"use client";

// app/context/AuthContext.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Permission, Role } from "@/lib/Auth/Permission";
import {
  clearSession,
  getSession,
  homeForRole,
  saveSession,
  type Session,
} from "@/lib/Auth/store";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: Role;
}

interface AuthValue {
  user: AuthUser | null;
  role: Role; // "guest" when signed out
  /** Where this role lands after signing in ("/", "/admin", "/wholesale", ...). */
  home: string;
  /** True until the first check for a signed-in user has finished. */
  loading: boolean;
  can: (permission: Permission) => boolean;
  /** Re-checks who is signed in (server first, local test session as a dev fallback). */
  refresh: () => Promise<void>;
  /** Call after a successful login/verification. */
  signIn: (session: Session) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

// What each role is allowed to do. Keep this in sync with your role files.
const ROLE_PERMISSIONS: Partial<Record<Role, readonly string[]>> = {
  guest: ["store:view"],
  user: ["store:view", "account:manage"],
  customer: [
    "store:view",
    "cart:use",
    "checkout:purchase",
    "events:preorder",
    "account:manage",
  ],
  wholesale: [
    "store:view",
    "wholesale:portal",
    "wholesale:order",
    "wholesale:pricing",
    "account:manage",
  ],
  admin: [
    "store:view",
    "admin:portal",
    "stock:view",
    "stock:edit",
    "orders:viewAll",
    "users:manage",
    "wholesale:pricing",
    "account:manage",
  ],
};

function roleCan(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * The local test session (localStorage) is for development only, while the real
 * backend does not exist yet. In production the role must come from your server,
 * never from something the browser can edit, so this fallback is switched off.
 * Set NEXT_PUBLIC_MOCK_AUTH=true / false to override.
 */
const MOCK_AUTH =
  process.env.NEXT_PUBLIC_MOCK_AUTH != null
    ? process.env.NEXT_PUBLIC_MOCK_AUTH === "true"
    : process.env.NODE_ENV !== "production";

function isRole(value: unknown): value is Role {
  return ["guest", "user", "customer", "wholesale", "admin"].includes(value as string);
}

function userFromLocalSession(): AuthUser | null {
  const s = getSession();
  if (!s || !isRole(s.role)) return null;
  return { id: s.email, email: s.email, name: s.name, role: s.role };
}

/**
 * Asks the server who is signed in: GET /api/auth/me must return
 * { id, email, name?, role } or a 401. Swap the fetch for Firebase/NextAuth/etc.
 * if that is what you use.
 */
async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });

    if (res.ok) {
      const data = await res.json();
      return isRole(data?.role) ? { ...data, role: data.role } : null;
    }

    // 403: the server refuses this user. Believe it.
    // 401: no server (Firebase) session. The login and sign-up pages still use the
    //      local test session, so fall back to it (dev only).
    // 404: the endpoint does not exist yet, so use the local test session (dev only).
    if (res.status !== 401 && res.status !== 404) return null;
  } catch {
    // Network error: fall through to the dev fallback below.
  }

  return MOCK_AUTH ? userFromLocalSession() : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    const next = await fetchCurrentUser();
    if (!mounted.current) return;
    setUser(next);
    setLoading(false);
  }, []);

  // Load the user once when the app starts.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signIn = useCallback(
    (session: Session) => {
      if (MOCK_AUTH && isRole(session.role)) {
        saveSession(session);
        setUser({ id: session.email, email: session.email, name: session.name, role: session.role });
        setLoading(false);
      } else {
        // Real backend: the server has already set its cookie, so just ask who we are.
        void refresh();
      }
    },
    [refresh],
  );

  const signOut = useCallback(async () => {
    clearSession();
    setUser(null);
    try {
      // Best effort: tell the server to end its session if the endpoint exists.
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      /* nothing to do */
    }
  }, []);

  const role: Role = user?.role ?? "guest";
  const value = useMemo<AuthValue>(
    () => ({
      user,
      role,
      home: homeForRole(role),
      loading,
      can: (p) => roleCan(role, p),
      refresh,
      signIn,
      signOut,
    }),
    [user, role, loading, refresh, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}