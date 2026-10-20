"use client";

import { RequireRole } from "@/app/components/RequiredRoles";
import { WholesalePortal } from "@/app/User/WholesSale/Wholesales";

export default function WholesalePage() {
  return (
    <RequireRole permission="wholesale:portal">
      <WholesalePortal />
    </RequireRole>
  );
}