"use client";

import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { PageHeading, Panel, buttonStyle } from "@/app/portal-ui/PortalUI";

export default function WholesaleAccount() {
  const { user } = useAuth();
  return <>
    <PageHeading title="Business account" subtitle="Your signed-in details and account preferences." />
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="Account details"><dl className="space-y-4 text-sm">
        <div><dt className="text-zinc-500">Contact name</dt><dd className="mt-1 font-semibold">{user?.name || "Not provided"}</dd></div>
        <div><dt className="text-zinc-500">Email</dt><dd className="mt-1 font-semibold break-all">{user?.email || "Not available"}</dd></div>
        <div><dt className="text-zinc-500">Account type</dt><dd className="mt-1 font-semibold capitalize">{user?.role || "Unknown"}</dd></div>
      </dl><Link href="/Setting" className={`${buttonStyle} mt-5`}>Open existing account settings</Link></Panel>
      <Panel title="Wholesale business profile"><p className="text-sm text-zinc-600">Business name, delivery addresses, invoice preferences, and notification settings will be available here once the wholesale account API supports them.</p>
        <div className="mt-5 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-500">No wholesale business profile connected yet.</div>
      </Panel>
    </div>
  </>;
}
