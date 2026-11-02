import Link from "next/link";
import type { RoleDefinition } from "@/lib/Auth/Permission";

// Guests can look, but not buy.
export const GUEST_ROLE: RoleDefinition = {
  role: "guest",
  label: "Guest",
  home: "/",
  permissions: ["store:view"],
};

/** Shown in place of Add to bag / Checkout buttons for guests. */
export function GuestPrompt({ action = "purchase items" }: { action?: string }) {
  return (
    <p role="note">
      <Link href="/login">Sign in</Link> or <Link href="/Signup">create an account</Link> to {action}.
    </p>
  );
}