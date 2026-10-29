"use client";

import AccountSettings from "./Accountsetting";

// The header's person icon always opens this page. Signed-in users see their
// settings; guests see a sign-in panel here instead of being sent to /login.
export default function AccountPage() {
  return <AccountSettings />;
}
