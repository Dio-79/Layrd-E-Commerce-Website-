"use client";

import { RequireRole } from "@/app/components/RequiredRoles";
import AccountSettings from "./Accountsetting";

// Any signed-in role with "account:manage" (customer, user, wholesale, admin) can open this page.
export default function AccountPage() {
  return (
    <RequireRole permission="account:manage">
      <AccountSettings />
    </RequireRole>
  );
}