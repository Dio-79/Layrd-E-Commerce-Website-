'use client';

import React from 'react';
import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { RequireRole } from '@/app/components/RequiredRoles';
import { useAuth } from '@/app/context/AuthContext';

// Pages that don't exist yet have no href and show as "coming soon".
const navLinks: { label: string; href?: string }[] = [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Products", href: "/admin/productmanagement" },
    { label: "Bundles", href: "/admin/bundles" },
    { label: "Upcoming releases", href: "/admin/releasemanagment" },
    { label: "Orders" },
    { label: "Customers" },
    { label: "Promotions" },
    { label: "Analytics" },
];

// The edit pages belong to a section of the sidebar.
function sectionOf(pathname: string) {
    if (pathname === "/admin" || pathname === "/admin/") return "/admin/dashboard";
    if (pathname.startsWith("/admin/editproduct")) return "/admin/productmanagement";
    if (pathname.startsWith("/admin/editbundles")) return "/admin/bundles";
    return pathname;
}

function AdminShell({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, signOut } = useAuth();
    const current = sectionOf(pathname);

    async function handleSignOut() {
        await signOut();
        router.replace("/login");
    }

    return (
        // admin container
        <div className="min-h-screen bg-[#faf9f6] text-zinc-900 md:flex">
            {/* Sidebar */}
            <aside className="border-b border-zinc-200 bg-white md:sticky md:top-0 md:flex md:h-screen md:w-64 md:shrink-0 md:flex-col md:border-b-0 md:border-r">
                <div className="px-5 py-5">
                    <Link href="/Mainpage" className="font-serif text-2xl font-bold tracking-[.2em] text-black">LÄYRD</Link>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[.16em] text-[#9b762e]">Admin Dashboard</p>
                    <Link
                        href="/admin/editproduct"
                        className="mt-5 flex w-full items-center justify-center rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700"
                    >
                        + Create New Product
                    </Link>
                </div>

                <nav aria-label="Admin navigation" className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-visible">
                    {navLinks.map((link) =>
                        link.href ? (
                            <Link
                                key={link.label}
                                href={link.href}
                                aria-current={current === link.href ? "page" : undefined}
                                className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-amber-50 ${
                                    current === link.href ? "bg-amber-100 text-[#735413]" : "text-zinc-700"
                                }`}
                            >
                                {link.label}
                            </Link>
                        ) : (
                            <span
                                key={link.label}
                                aria-disabled="true"
                                className="flex shrink-0 items-center justify-between gap-2 rounded-lg px-4 py-2.5 text-sm text-zinc-400"
                            >
                                {link.label}
                                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase">soon</span>
                            </span>
                        )
                    )}
                </nav>

                <div className="hidden border-t border-zinc-200 px-3 py-3 md:block">
                    <span aria-disabled="true" className="flex items-center justify-between rounded-lg px-4 py-2 text-sm text-zinc-400">
                        Settings
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase">soon</span>
                    </span>
                    <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full rounded-lg px-4 py-2 text-left text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                    >
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main area */}
            <div className="min-w-0 flex-1">
                {/* Top bar */}
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3 sm:px-6">
                    <input
                        placeholder="Search orders, customers..."
                        aria-label="Search orders and customers"
                        className="w-full max-w-sm rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-amber-500"
                    />
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-sm font-semibold">{user?.name || user?.email || "Admin"}</p>
                            <p className="text-xs text-zinc-500">LÄYRD Admin</p>
                        </div>
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-[#735413]">
                            {(user?.name || user?.email || "A").charAt(0).toUpperCase()}
                        </span>
                        <button type="button" onClick={handleSignOut} className="text-sm font-semibold text-zinc-600 hover:text-black md:hidden">
                            Sign Out
                        </button>
                    </div>
                </header>

                <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
            </div>
        </div>
    );
}

// Only admins can open /admin pages: signed-out visitors go to the login page,
// other signed-in users go back to their own home page.
export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <RequireRole permission="admin:portal">
            <AdminShell>{children}</AdminShell>
        </RequireRole>
    );
}
