import React from 'react';
import Link from 'next/link';
import CartBadge from './CartBadge';
import { ROUTES } from '@/lib/Routes/Routes';
  
const Header = () => {
  return (
    <header className="w-full bg-white font-sans border-b border-yellow-500">
      {/* Top Banner */}
      <div className="bg-black py-2 text-center">
        <p className="text-yellow-400 text-xs font-semibold tracking-wide">
          NEW LIMITED EDITION FLAVORS OUT THIS WEEKEND !{' '}
          <Link href="#" className="underline ml-1">
            LEARN MORE
          </Link>
        </p>
      </div>

      {/* Main Bar */}
      <div className="flex flex-row items-center justify-between px-8 py-4 max-w-7xl mx-auto">
        {/* Hamburger Menu */}
        <button type="button" aria-label="Menu" className="text-gray-700 text-xl focus:outline-none">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo */}
        <Link href={ROUTES.main}>
          <div className="text-3xl font-extrabold tracking-widest font-serif text-black">
            LÄYRD
          </div>
        </Link>

        {/* Action Icons */}
        <div className="flex items-center space-x-4 text-gray-700">
          <button type="button" aria-label="Search">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <Link href={ROUTES.settings} aria-label="Account" className="inline-flex items-center justify-center text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>

          {/* Shopping bag: opens the cart and shows how many items are in it */}
          <Link
            href={ROUTES.cart}
            aria-label="Shopping Bag"
            className="relative inline-flex items-center justify-center text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <CartBadge />
          </Link>
        </div>
      </div>

      {/* Navigation Sub-menu */}
      <nav className="flex justify-center space-x-8 py-3 text-xs font-bold uppercase tracking-wider text-black">
        <Link href={ROUTES.drinks} className="hover:underline">Drinks</Link>
        <Link href={ROUTES.cakeInACan} className="hover:underline">Cake-in-a-Can</Link>
        <Link href={ROUTES.bundles} className="hover:underline">Bundles</Link>
        <Link href={ROUTES.eventOrder} className="hover:underline">Event Ordering</Link>
        <Link href="#" className="hover:underline">More</Link>
      </nav>
    </header>
  );
};

export default Header;