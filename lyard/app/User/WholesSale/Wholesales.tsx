"use client";

import { useAuth } from "@/app/context/AuthContext";
import type { RoleDefinition } from "@/lib/Auth/Permission";

// Wholesale buyers use their own portal and pricing. They do not use the retail checkout.
export const WHOLESALE_ROLE: RoleDefinition = {
  role: "wholesale",
  label: "Wholesale",
  home: "/wholesale",
  permissions: [
    "store:view",
    "wholesale:portal",
    "wholesale:order",
    "wholesale:pricing",
    "account:manage",
  ],
};

/** Page body for /wholesale. Wrap the route in <RequireRole permission="wholesale:portal">. */
export function WholesalePortal() {
  const { user, can } = useAuth();

  return (
    <section aria-labelledby="wholesale-title">
      <h1 id="wholesale-title">Wholesale portal</h1>
      <p>Signed in as {user?.name ?? user?.email}.</p>

      {can("wholesale:pricing") && (
        <div>
          <h2>Wholesale price list</h2>
          {/* TODO: render your wholesale price list here */}
        </div>
      )}

      {can("wholesale:order") && (
        <div>
          <h2>Place a bulk order</h2>
          {/* TODO: bulk order form (case sizes, minimum quantities, invoice terms) */}
        </div>
      )}
    </section>
  );
}