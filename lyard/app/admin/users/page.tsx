import { PageHeading, Panel } from "@/app/portal-ui/PortalUI";

export default function AdminUsers() {
  return <>
    <PageHeading title="User management" subtitle="Manage retail, wholesale and administrative accounts." />
    <Panel title="Accounts"><div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
      <h2 className="font-semibold">User directory not connected</h2>
      <p className="mt-2 text-sm text-zinc-600">A role-protected users API is required to list accounts, change roles and suspend accounts. No user records are being invented for this screen.</p>
    </div></Panel>
    <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-[#735413]">Backend requirement: admin-only GET /api/admin/users and PATCH /api/admin/users/[id]. The server must validate permissions for every request; client-side checks alone are insufficient.</div>
  </>;
}
