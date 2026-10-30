"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import CartBadge from "./CartBadge";
import { ROUTES } from "@/lib/Routes/Routes";

// Everything the ☰ menu lists, and the "More" dropdown's links
const MENU_LINKS = [
  { href: ROUTES.main, label: "Home" },
  { href: ROUTES.drinks, label: "Drinks" },
  { href: ROUTES.cakeInACan, label: "Cake-in-a-Can" },
  { href: ROUTES.bundles, label: "Bundles" },
  { href: ROUTES.eventOrder, label: "Event Ordering" },
  { href: ROUTES.search, label: "Search" },
  { href: ROUTES.cart, label: "Your Bag" },
  { href: ROUTES.settings, label: "Account" },
];

const MORE_LINKS = [
  { href: ROUTES.contact, label: "Contact Us" },
  { href: `${ROUTES.info}#faq`, label: "FAQ" },
  { href: `${ROUTES.info}#shipping`, label: "Shipping & Pickup" },
  { href: ROUTES.refund, label: "Request a Refund" },
  { href: ROUTES.wholesale, label: "Wholesale" },
  { href: `${ROUTES.info}#about`, label: "About LÄYRD" },
];

const Header = () => {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close the menus on navigation and with Escape; close "More" when clicking elsewhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setMoreOpen(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenuOpen(false);
    setMoreOpen(false);
  }

  return (
    <header className="w-full bg-white font-sans border-b border-yellow-500">
      {/* Top Banner */}
      <div className="bg-black py-2 text-center">
        <p className="text-yellow-400 text-xs font-semibold tracking-wide">
          NEW LIMITED EDITION FLAVORS OUT THIS WEEKEND !{" "}
          <Link href={ROUTES.cakeInACan} className="underline ml-1">
            LEARN MORE
          </Link>
        </p>
      </div>

      {/* Main Bar */}
      <div className="flex flex-row items-center justify-between px-8 py-4 max-w-7xl mx-auto">
        {/* Hamburger Menu */}
        <button
          type="button"
          aria-label="Menu"
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          onClick={() => setMenuOpen(true)}
          className="text-gray-700 text-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo */}
        <Link href={ROUTES.main} aria-label="LÄYRD home">
          <div className="text-3xl font-extrabold tracking-widest font-serif text-black">LÄYRD</div>
        </Link>

        {/* Action Icons */}
        <div className="flex items-center space-x-4 text-gray-700">
          {/* Search */}
          <Link
            href={ROUTES.search}
            aria-label="Search"
            className="inline-flex items-center justify-center text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </Link>

          {/* Account settings */}
          <Link
            href={ROUTES.settings}
            aria-label="Account"
            className="inline-flex items-center justify-center text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </Link>

          {/* Shopping bag: opens the cart and shows how many items are in it */}
          <Link
            href={ROUTES.cart}
            aria-label="Shopping Bag"
            className="relative inline-flex items-center justify-center text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <CartBadge />
          </Link>
        </div>
      </div>

      {/* Navigation Sub-menu */}
      <nav
        aria-label="Main"
        className="flex justify-center items-center space-x-8 py-3 text-xs font-bold uppercase tracking-wider text-black"
      >
        <Link href={ROUTES.drinks} className="hover:underline">
          Drinks
        </Link>
        <Link href={ROUTES.cakeInACan} className="hover:underline">
          Cake-in-a-Can
        </Link>
        <Link href={ROUTES.bundles} className="hover:underline">
          Bundles
        </Link>
        <Link href={ROUTES.eventOrder} className="hover:underline">
          Event Ordering
        </Link>
        <div className="relative" ref={moreRef}>
          <button
            type="button"
            className="font-bold uppercase tracking-wider hover:underline"
            aria-expanded={moreOpen}
            aria-haspopup="true"
            onClick={() => setMoreOpen((open) => !open)}
          >
            More ▾
          </button>
          {moreOpen && (
            <ul className="absolute right-0 z-40 mt-3 w-56 border border-yellow-500 bg-white py-2 text-left normal-case tracking-normal shadow-lg">
              {MORE_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="block px-4 py-2 text-sm font-medium text-black hover:bg-yellow-50">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </nav>

      {/* ☰ slide-out menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50" role="presentation" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
          <nav
            id="site-menu"
            aria-label="Site menu"
            className="absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col gap-1 overflow-y-auto bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-2xl font-extrabold tracking-widest font-serif">LÄYRD</span>
              <button
                type="button"
                aria-label="Close menu"
                className="text-2xl leading-none text-gray-700"
                onClick={() => setMenuOpen(false)}
              >
                ×
              </button>
            </div>
            {MENU_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="border-b border-gray-100 py-3 text-sm font-bold uppercase tracking-wider text-black hover:text-yellow-600"
              >
                {l.label}
              </Link>
            ))}
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-yellow-600">More</p>
            {MORE_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="py-2 text-sm text-gray-700 hover:text-black">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
