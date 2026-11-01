import type { ReactNode } from "react";
import { PortalShell } from "@/app/portal-ui/PortalUI";
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <PortalShell kind="admin">{children}</PortalShell>;
}
