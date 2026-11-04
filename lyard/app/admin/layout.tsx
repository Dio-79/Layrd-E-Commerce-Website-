'use client';

import React from 'react';
import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Montserrat } from 'next/font/google';
import { RequireRole } from '@/app/components/RequiredRoles';
import { useAuth } from '@/app/context/AuthContext';
import { THEMES, type AdminTheme } from './adminStyles';

// The admin's light/dark choice is remembered in this browser.
const THEME_KEY = 'layrd-admin-theme';
const themeListeners = new Set<() => void>();

function readTheme(): AdminTheme {
    try {
        return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
    } catch {
        return 'dark';
    }
}

function saveTheme(theme: AdminTheme) {
    try {
        localStorage.setItem(THEME_KEY, theme);
    } catch {
        /* storage blocked: the choice just won't be remembered */
    }
    themeListeners.forEach((listener) => listener());
}

function useAdminTheme(): AdminTheme {
    return React.useSyncExternalStore(
        (listener) => {
            themeListeners.add(listener);
            return () => themeListeners.delete(listener);
        },
        readTheme,
        () => 'dark',
    );
}

// Layout follows the team's Figma (low-fi & prototyping > "Admin Dashboard"):
// dark charcoal, gold accents, icon sidebar, "LÄYRD Admin" top bar.
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' });

/* ---------- Small line icons (24px, stroke = currentColor) ---------- */

const ICONS: Record<string, React.ReactNode> = {
    dashboard: <path d="M12 3 3 7.5 12 12l9-4.5L12 3Zm-9 9 9 4.5 9-4.5M3 16.5 12 21l9-4.5" />,
    products: <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Zm0 0L12 12m0 0 9-4.5M12 12v9" />,
    bundles: <path d="M4 8h16v12H4V8Zm-1-4h18v4H3V4Zm7 8h4" />,
    releases: <path d="M4 6h16v14H4V6Zm0 4h16M8 3v4m8-4v4" />,
    orders: <path d="M6 7h12l-1 13H7L6 7Zm3 0a3 3 0 0 1 6 0" />,
    customers: <path d="M3 5h18v14H3V5Zm4 4h4v4H7V9Zm7 0h4m-4 4h4" />,
    promotions: <path d="M3 12V4h8l10 10-8 8L3 12Zm5-4h.01" />,
    analytics: <path d="M4 20V10m6 10V4m6 16v-7m4 7H2" />,
    settings: <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14.5 3h-5l-.4 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2l.4 2.6h5l.4-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z" />,
    search: <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5-2 4 4" />,
    bell: <path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4l2-2Zm4 4h4" />,
    moon: <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />,
    sun: <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0-14v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />,
};

function Icon({ name, className = 'h-5 w-5' }: { name: string; className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
            {ICONS[name]}
        </svg>
    );
}

// Pages that don't exist yet have no href and show as "coming soon".
const navLinks: { label: string; icon: string; href?: string }[] = [
    { label: "Dashboard", icon: "dashboard", href: "/admin/dashboard" },
    { label: "Products", icon: "products", href: "/admin/productmanagement" },
    { label: "Bundles", icon: "bundles", href: "/admin/bundles" },
    { label: "Releases", icon: "releases", href: "/admin/releasemanagment" },
    { label: "Orders", icon: "orders", href: "/admin/orders" },
    { label: "Customers", icon: "customers", href: "/admin/customers" },
    { label: "Promotions", icon: "promotions", href: "/admin/promotions" },
    { label: "Analytics", icon: "analytics", href: "/admin/analytics" },
];

// The edit pages belong to a section of the sidebar.
function sectionOf(pathname: string) {
    if (pathname === "/admin" || pathname === "/admin/") return "/admin/dashboard";
    if (pathname.startsWith("/admin/editproduct")) return "/admin/productmanagement";
    if (pathname.startsWith("/admin/editbundles")) return "/admin/bundles";
    return pathname;
}

const GOLD_TEXT = "text-[var(--a-gold)]";

function AdminShell({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, signOut } = useAuth();
    const current = sectionOf(pathname);
    const displayName = user?.name || user?.email || "Admin Profile";
    const theme = useAdminTheme();
    const nextTheme: AdminTheme = theme === "dark" ? "light" : "dark";

    async function handleSignOut() {
        await signOut();
        router.replace("/login");
    }

    return (
        // admin container
        <div
            className={`${montserrat.variable} min-h-screen bg-[var(--a-page)] text-[var(--a-text)] transition-colors md:flex`}
            style={{
                ...(THEMES[theme] as React.CSSProperties),
                colorScheme: theme,
                fontFamily: "var(--font-montserrat), Montserrat, system-ui, sans-serif",
            }}
        >
            {/* Sidebar */}
            <aside className="border-b border-[var(--a-gold)]/50 bg-[var(--a-panel)] md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col md:border-b-0 md:border-r">
                <div className="px-6 pb-4 pt-6">
                    <Link href="/Mainpage" className={`text-2xl font-medium tracking-[.2em] ${GOLD_TEXT}`}>LÄYRD</Link>
                    <p className="mt-1 text-sm text-[var(--a-text-2)]">Admin Dashboard</p>
                    <Link
                        href="/admin/editproduct"
                        className="mt-4 flex w-full items-center justify-center rounded-sm bg-[var(--a-gold)] px-3 py-2 text-xs font-semibold text-black hover:bg-[var(--a-gold-hover)]"
                    >
                        + Create New Product
                    </Link>
                </div>

                <nav aria-label="Admin navigation" className="flex gap-1 overflow-x-auto px-3 pb-3 pt-2 md:flex-1 md:flex-col md:overflow-visible">
                    {navLinks.map((link) => {
                        const active = current === link.href;
                        return link.href ? (
                            <Link
                                key={link.label}
                                href={link.href}
                                aria-current={active ? "page" : undefined}
                                className={`flex shrink-0 items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors hover:bg-[var(--a-hover)] ${
                                    active ? `${GOLD_TEXT} underline underline-offset-4` : "text-[var(--a-text)]"
                                }`}
                            >
                                <Icon name={link.icon} />
                                {link.label}
                            </Link>
                        ) : (
                            <span
                                key={link.label}
                                aria-disabled="true"
                                title="Coming soon"
                                className="flex shrink-0 items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-[var(--a-faint)]"
                            >
                                <Icon name={link.icon} />
                                {link.label}
                                <span className="ml-auto rounded-sm border border-[var(--a-border)] px-1.5 text-[9px] font-semibold uppercase tracking-wide">soon</span>
                            </span>
                        );
                    })}
                </nav>

                <div className="hidden border-t border-[var(--a-gold)]/50 px-3 py-4 md:block">
                    {/* Jump to the other two sides of the site */}
                    <Link href="/Mainpage" className="flex items-center gap-3 rounded-sm px-3 py-2 text-sm text-[var(--a-text-2)] hover:bg-[var(--a-hover)] hover:text-[var(--a-gold)]">
                        <Icon name="orders" />
                        View shop
                    </Link>
                    <Link href="/wholesale" className="flex items-center gap-3 rounded-sm px-3 py-2 text-sm text-[var(--a-text-2)] hover:bg-[var(--a-hover)] hover:text-[var(--a-gold)]">
                        <Icon name="bundles" />
                        Wholesale portal
                    </Link>
                    <span aria-disabled="true" title="Coming soon" className="flex items-center gap-3 px-3 py-2 text-sm text-[var(--a-faint)]">
                        <Icon name="settings" />
                        Settings
                    </span>
                    <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full px-3 py-2 text-left text-sm font-semibold text-[var(--a-danger)] hover:text-[var(--a-danger)]"
                    >
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main area */}
            <div className="min-w-0 flex-1">
                {/* Top bar */}
                <header className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-[var(--a-gold)]/50 bg-[var(--a-panel)] px-4 py-3 sm:px-6 lg:grid-cols-[1fr_auto_1fr]">
                    <label className="flex max-w-xs items-center gap-2 rounded-sm bg-[var(--a-card)] px-3 py-2 text-[var(--a-muted)]">
                        <Icon name="search" className="h-4 w-4" />
                        <input
                            placeholder="Search orders, customers..."
                            aria-label="Search orders and customers"
                            className="w-full bg-transparent text-sm text-[var(--a-text)] placeholder:text-[var(--a-muted)] focus:outline-none"
                        />
                    </label>
                    <p className={`hidden text-xl font-semibold tracking-[.18em] lg:block ${GOLD_TEXT}`}>LÄYRD Admin</p>
                    <div className="flex items-center justify-end gap-4 text-[var(--a-text-2)]">
                        <Icon name="bell" />
                        <button
                            type="button"
                            onClick={() => saveTheme(nextTheme)}
                            aria-label={`Switch to ${nextTheme} mode`}
                            title={`Switch to ${nextTheme} mode`}
                            className="rounded-full p-1 hover:bg-[var(--a-hover)] hover:text-[var(--a-gold)]"
                        >
                            <Icon name={theme === "dark" ? "moon" : "sun"} />
                        </button>
                        <span className="hidden h-8 w-px bg-[var(--a-border)] sm:block" />
                        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--a-strong)] text-xs font-semibold">
                            {displayName.charAt(0).toUpperCase()}
                        </span>
                        <span className="hidden text-xs font-semibold sm:block">{displayName}</span>
                        <button type="button" onClick={handleSignOut} className="text-xs font-semibold text-[var(--a-danger)] md:hidden">
                            Sign Out
                        </button>
                    </div>
                </header>

                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">{children}</main>
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
