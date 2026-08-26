'use client';

import Link from 'next/link';

function HeartIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      stroke="none"
    >
      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
    </svg>
  );
}

function ShoppingCartIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
      />
    </svg>
  );
}

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Donasi', href: '/donasi' },
  { label: 'Preloved', href: '/preloved' },
  { label: 'About', href: '/about' },
];

export default function Navbar() {
  return (
    <header className="w-full sticky top-0 z-50">
      <div className="w-full bg-brand-cream-light">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="flex h-14 items-center justify-end">
            <Link
              href="/login"
              className="text-sm font-medium text-brand-blue hover:opacity-80 transition-opacity"
            >
              Login
            </Link>
          </div>
        </div>
      </div>

      <div className="w-full bg-brand-blue">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="flex h-20 items-center justify-between gap-6">
            <div className="flex items-center shrink-0">
              <Link href="/" className="text-5xl sm:text-6xl font-bold tracking-wide text-brand-cream-dark">
                LOGO
              </Link>
            </div>

            <nav className="hidden md:flex items-center justify-center gap-8 lg:gap-10">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xl lg:text-2xl font-medium text-brand-cream-dark hover:opacity-80 transition-opacity whitespace-nowrap"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-4 sm:gap-6 shrink-0">
              <button
                type="button"
                aria-label="Favorit"
                className="text-brand-cream-dark hover:opacity-80 transition-opacity"
              >
                <HeartIcon className="h-8 w-8 sm:h-9 sm:w-9" />
              </button>
              <button
                type="button"
                aria-label="Keranjang belanja"
                className="text-brand-cream-dark hover:opacity-80 transition-opacity"
              >
                <ShoppingCartIcon className="h-9 w-9 sm:h-10 sm:w-10" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
