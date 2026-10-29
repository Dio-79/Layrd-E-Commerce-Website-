"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import {
  buildProfile,
  identityOf,
  profileStore,
  type AuthUserLike,
  type CustomerProfile,
} from "@/lib/Account/profile";

/**
 * The signed-in customer's profile.
 * Starts from the account's own details (AuthContext) and layers on what they saved.
 */
export function useCustomerProfile() {
  const { user: authUser } = useAuth();
  const user = authUser as unknown as AuthUserLike | null | undefined;

  const identity = identityOf(user);
  const id = user?.id;
  const name = user?.name;
  const email = user?.email;
  const phone = user?.phone;

  const [state, setState] = useState<{ identity: string; profile: CustomerProfile } | null>(null);

  useEffect(() => {
    if (!identity) return;
    let cancelled = false;

    profileStore.load(identity).then((saved) => {
      if (cancelled) return;
      setState({ identity, profile: buildProfile({ id, name, email, phone }, saved) });
    });

    return () => {
      cancelled = true;
    };
  }, [identity, id, name, email, phone]);

  const profile = state && state.identity === identity ? state.profile : null;
  const loading = identity !== "" && profile === null;

  const save = useCallback(
    async (next: CustomerProfile) => {
      if (!identity) throw new Error("Sign in to save your account settings.");
      await profileStore.save(identity, next);
      setState({ identity, profile: next });
    },
    [identity]
  );

  return { identity, profile, loading, save };
}