"use client";

import { RequireRole } from "@/app/components/RequiredRoles";
import { AdminPortal } from "@/app/User/Admin/Adminstartor";

export default function AdminPage() {
  return (
    <RequireRole permission="admin:portal">
      <AdminPortal />
    </RequireRole>
  );
}