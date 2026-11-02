"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RequireRole } from "@/app/components/RequiredRoles";

const menus = {
  wholesale: [
    { href: "/wholesale/dashboard", label: "Dashboard" },
    { href: "/wholesale/catalog", label: "Catalog" },
    { href: "/wholesale/order", label: "Bulk order" },
    { href: "/wholesale/history", label: "Order history" },
    { href: "/wholesale/Account", label: "Account" },
  ],
  admin: [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/products", label: "Products & stock" },
    { href: "/admin/orders", label: "Orders" },
  ],
};

export function PortalShell({ kind, children }: { kind: "wholesale" | "admin"; children: ReactNode }) {
  const pathname = usePathname();
  const permission = kind === "admin" ? "admin:portal" : "wholesale:portal";
  return (
    <RequireRole permission={permission}>
      <div className="min-h-screen bg-[#faf9f6] text-zinc-900">
        <header className="border-b border-amber-300 bg-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
            <Link href="/Mainpage" className="font-serif text-2xl font-bold tracking-[.20em] text-black" aria-label="LÄYRD home">LÄYRD</Link>
            <span className="text-xs font-semibold uppercase tracking-[.16em] text-[#9b762e]">{kind === "admin" ? "Admin portal" : "Wholesale portal"}</span>
          </div>
        </header>
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:grid-cols-[220px_minmax(0,1fr)] md:px-6">
          <nav aria-label={`${kind} navigation`} className="flex gap-2 overflow-x-auto rounded-xl border border-zinc-200 bg-white p-2 md:h-fit md:flex-col md:p-3">
            {menus[kind].map((entry) => {
              const active = pathname === entry.href;
              return (
                <Link key={entry.href} href={entry.href} aria-current={active ? "page" : undefined}
                  className={`shrink-0 rounded-lg px-4 py-3 text-sm font-semibold transition-colors hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-amber-500 ${active ? "bg-amber-100 text-[#735413]" : "text-zinc-700"}`}>
                  {entry.label}
                </Link>
              );
            })}
          </nav>
          <main className="min-w-0 pb-12">{children}</main>
        </div>
      </div>
    </RequireRole>
  );
}

export function PageHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">{title}</h1>{subtitle && <p className="mt-1 text-sm text-zinc-600">{subtitle}</p>}</div>
      {action}
    </div>
  );
}

export function Panel({ title, children }: { title?: string; children: ReactNode }) {
  return <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
    {title && <h2 className="mb-4 text-lg font-bold text-zinc-900">{title}</h2>}{children}
  </section>;
}

export function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"><p className="text-sm text-zinc-600">{label}</p><p className="mt-2 text-2xl font-bold text-zinc-950">{value}</p></div>;
}

export function DataState({ loading, error, empty, retry }: { loading: boolean; error: string | null; empty?: string; retry?: () => void }) {
  if (loading) return <div role="status" className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-600">Loading…</div>;
  if (error) return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800"><p>{error}</p>{retry && <button onClick={retry} type="button" className="mt-3 rounded bg-white px-3 py-2 font-semibold underline">Try again</button>}</div>;
  if (empty) return <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-600">{empty}</div>;
  return null;
}

export const buttonStyle = "inline-flex items-center justify-center rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500";
export const inputStyle = "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:outline-2 focus-visible:outline-amber-500";
