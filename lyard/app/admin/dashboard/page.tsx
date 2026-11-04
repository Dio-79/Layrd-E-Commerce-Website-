import React from 'react';
import Link from 'next/link';

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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div>
            {/* Sidebar */}
            <aside>
                <div>
                    <p>LÄYRD</p>
                    <p>Admin Dashboard</p>
                    <button>+ Create New Product</button>
                </div>

                <nav>
                    {navLinks.map((link) =>
                        link.href ? (
                            <Link key={link.label} href={link.href}>
                                {link.label}
                            </Link>
                        ) : (
                            <span key={link.label} aria-disabled="true">
                                {link.label} (coming soon)
                            </span>
                        )
                    )}
                </nav>

                <div>
                    <span aria-disabled="true">Settings (coming soon)</span>
                    <p>Sign Out</p>
                </div>
            </aside>

            {/* Main area */}
            <div>
                {/* Top bar */}
                <header>
                    <input placeholder="Search orders, customers..." />
                    <h1>LÄYRD Admin</h1>
                    <p>Admin Profile</p>
                </header>

                {children}
            </div>
        </div>
    );
}

