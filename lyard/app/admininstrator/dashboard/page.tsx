import React from 'react';
import Link from 'next/link';

const navLinks = [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Products", href: "/admin/productmanagement" },
    { label: "Bundles", href: "/admin/bundles" },
    { label: "Orders", href: "/admin/orders" },
    { label: "Customers", href: "/admin/customers" },
    { label: "Promotions", href: "/admin/promotions" },
    { label: "Analytics", href: "/admin/analytics" },
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
                    {navLinks.map((link) => (
                        <Link key={link.href} href={link.href}>
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div>
                    <Link href="/admin/settings">Settings</Link>
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

