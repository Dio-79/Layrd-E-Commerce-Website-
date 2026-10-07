import React from 'react';

const Header = () => {
  return (
    <header className="w-full bg-white font-sans border-b border-yellow-500">
      {/* Top Banner */}
      <div className="bg-black py-2 text-center">
        <p className="text-yellow-400 text-xs font-semibold tracking-wide">
          NEW LIMITED EDITION FLAVORS OUT THIS WEEKEND !{' '}
          <a href="#" className="underline ml-1">
            LEARN MORE
          </a>
        </p>
      </div>

      {/* Main Bar */}
      <div className="flex flex-row items-center justify-between px-8 py-4 max-w-7xl mx-auto">
        {/* Hamburger Menu */}
        <button type="button" className="text-gray-700 text-xl focus:outline-none">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo */}
        <div className="text-3xl font-extrabold tracking-widest font-serif text-black">
          LÄYRD
        </div>

        {/* Action Icons */}
        <div className="flex items-center space-x-4 text-gray-700">
          <button type="button" aria-label="Search">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button type="button" aria-label="Account">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
          <button type="button" aria-label="Shopping Bag">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation Sub-menu */}
      <nav className="flex justify-center space-x-8 py-3 text-xs font-bold uppercase tracking-wider text-black">
        <a href="#" className="hover:underline">Drinks</a>
        <a href="#" className="hover:underline">Cake-in-a-Can</a>
        <a href="#" className="hover:underline">Bundles</a>
        <a href="#" className="hover:underline">Event Ordering</a>
        <a href="#" className="hover:underline">More</a>
      </nav>
    </header>
  );
};

export default Header;