'use client';

// app/context/AuthContext.tsx
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Permission, RoleDefinition } from '@/lib/Auth/Permission';
import { getRoleDefinition, roleCan } from '@/lib/Auth/Roles';
import { clearSession, getSession, saveSession, type Role, type Session } from '@/lib/Auth/store';

interface AuthContextValue {
  /** The signed-in user, or null for guests. */
  user: Session | null;
  /** The current role ("guest" when signed out). */
  role: Role;
  roleDefinition: RoleDefinition;
  /** False until the saved session has been read in the browser. */
  ready: boolean;
  can: (permission: Permission) => boolean;
  signIn: (session: Session) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Wrap the app with this (for example in app/layout.tsx). */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  // Read the saved session once, in the browser.
  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      if (!active) return;
      setUser(getSession());
      setReady(true);
    });

    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback((session: Session) => {
    saveSession(session);
    setUser(session);
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const role: Role = user?.role ?? 'guest';
    return {
      user,
      role,
      roleDefinition: getRoleDefinition(role),
      ready,
      can: (permission) => roleCan(role, permission),
      signIn,
      signOut,
    };
  }, [user, ready, signIn, signOut]);

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>.');
  return ctx;
}