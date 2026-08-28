'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import FoldText from './FoldText';
import Logo from './Logo';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Donasi', href: '/donasi' },
  { label: 'Preloved', href: '/preloved' },
  { label: 'About', href: '/about' },
];

const TAGLINE = 'Semua Berawal dari Lemarimu';

function NavIcon({ src, alt, className = 'h-6 w-6' }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} />
  );
}

function UserIcon({ className = 'h-6 w-6' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className={className} fill="#D8D4B8" aria-hidden="true">
      <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Z" />
    </svg>
  );
}

function TaglineBanner() {
  return (
    <div className="w-full bg-brand-light-green">
      <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-2.5">
        <FoldText
          text={TAGLINE}
          splitBy="char"
          hinge="top"
          trigger="loop"
          repeatDelay={5}
          duration={0.65}
          stagger={0.045}
          ease="power3.out"
          perspective={700}
          creaseShading={0.55}
          fontSize="clamp(0.6875rem, 1.6vw, 0.75rem)"
          fontWeight={500}
          color="#214944"
          className="uppercase text-center"
          style={{ letterSpacing: '0.22em' }}
        />
      </div>
    </div>
  );
}

function isActivePath(pathname, href) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ href, label, pathname, onClick, className = '' }) {
  const isActive = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={[
        'relative inline-flex w-fit pb-1 text-xs lg:text-sm font-medium uppercase tracking-[0.18em] whitespace-nowrap transition-colors',
        'after:absolute after:left-0 after:bottom-0 after:h-[1.5px] after:w-full after:origin-left after:bg-brand-light-green after:transition-transform after:duration-300 after:ease-out motion-reduce:after:transition-none',
        isActive
          ? 'text-white after:scale-x-100'
          : 'text-brand-cream after:scale-x-0 hover:text-brand-light-green hover:after:scale-x-100',
        className,
      ].join(' ')}
    >
      {label}
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="w-full sticky top-0 z-50">
      <TaglineBanner />

      <div className="w-full bg-brand-green">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-3 items-center h-20 gap-4">
            <div className="justify-self-start">
              <Link
                href="/"
                aria-label="Cycle Clothes"
                className="block text-brand-cream hover:opacity-90 transition-opacity"
              >
                <Logo className="h-6 sm:h-7 w-auto max-w-[200px] sm:max-w-[260px]" />
              </Link>
            </div>

            <nav className="hidden md:flex items-center justify-center gap-7 lg:gap-10 justify-self-center">
              {NAV_LINKS.map((link) => (
                <NavLink key={link.href} href={link.href} label={link.label} pathname={pathname} />
              ))}
            </nav>

            <div className="flex items-center justify-end gap-4 sm:gap-5 justify-self-end">
              <button type="button" aria-label="Cari" className="hover:opacity-70 transition-opacity">
                <NavIcon src="/incons/search.svg" alt="" />
              </button>
              <button type="button" aria-label="Wishlist" className="hover:opacity-70 transition-opacity">
                <NavIcon src="/incons/wishlist.svg" alt="" />
              </button>
              <Link href="/login" aria-label="Akun" className="hover:opacity-70 transition-opacity">
                <UserIcon />
              </Link>
              <button type="button" aria-label="Keranjang belanja" className="relative hover:opacity-70 transition-opacity">
                <NavIcon src="/incons/bag.svg" alt="" />
              </button>
              <button
                type="button"
                aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen((open) => !open)}
                className="md:hidden hover:opacity-70 transition-opacity"
              >
                <NavIcon src="/incons/list.svg" alt="" className="h-7 w-7" />
              </button>
            </div>
          </div>

          {mobileOpen && (
            <nav className="md:hidden pb-5 flex flex-col gap-3">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  pathname={pathname}
                  onClick={() => setMobileOpen(false)}
                />
              ))}
              <NavLink
                href="/login"
                label="Login"
                pathname={pathname}
                onClick={() => setMobileOpen(false)}
              />
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
