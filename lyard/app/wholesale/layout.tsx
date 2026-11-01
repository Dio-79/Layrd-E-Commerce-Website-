import type { ReactNode } from "react";
import { PortalShell } from "@/app/portal-ui/PortalUI";
export default function WholesaleLayout({ children }: { children: ReactNode }) {
  return <PortalShell kind="wholesale">{children}</PortalShell>;
}
