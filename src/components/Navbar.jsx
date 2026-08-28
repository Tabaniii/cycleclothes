'use client';

import { useEffect, useState } from 'react';
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
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className={className} fill="currentColor" aria-hidden="true">
      <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Z" />
    </svg>
  );
}

function HeartIcon({ className = 'h-6 w-6' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className={className} fill="currentColor" aria-hidden="true">
      <path d="m480-173.85-30.31-27.38q-97.92-89.46-162-153.15-64.07-63.7-101.15-112.35-37.08-48.65-51.81-88.04Q120-594.15 120-634q0-76.31 51.85-128.15Q223.69-814 300-814q52.77 0 99 27t81 78.54Q514.77-760 561-787q46.23-27 99-27 76.31 0 128.15 51.85Q840-710.31 840-634q0 39.85-14.73 79.23-14.73 39.39-51.81 88.04-37.08 48.65-100.77 112.35Q609-290.69 510.31-201.23L480-173.85Z" />
    </svg>
  );
}

function BagIcon({ className = 'h-6 w-6' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className={className} fill="currentColor" aria-hidden="true">
      <path d="M264.62-120q-27.62 0-46.12-18.5Q200-157 200-184.62v-430.76q0-27.62 18.5-46.12Q237-680 264.62-680H340v-20q0-58.31 40.85-99.15Q421.69-840 480-840t99.15 40.85Q620-758.31 620-700v20h75.38q27.62 0 46.12 18.5Q760-643 760-615.38v430.76q0 27.62-18.5 46.12Q723-120 695.38-120H264.62ZM380-680h200v-20q0-42.23-28.88-71.12Q522.23-800 480-800q-42.23 0-71.12 28.88Q380-742.23 380-700v20Z" />
    </svg>
  );
}

function DonateIcon({ className = 'h-6 w-6' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10Z" />
    </svg>
  );
}

function PhoneIcon({ className = 'h-6 w-6' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.6 4.8h2.3l1.1 2.8-1.5 1.5a12.6 12.6 0 0 0 5.4 5.4l1.5-1.5 2.8 1.1v2.3c0 .7-.5 1.3-1.2 1.4A15.2 15.2 0 0 1 5.2 6c.1-.7.7-1.2 1.4-1.2Z" />
    </svg>
  );
}

function CloseIcon({ className = 'h-6 w-6' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function ChevronIcon({ className = 'h-4 w-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
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

function QuickAction({ href, label, icon, onClick }) {
  const className =
    'flex flex-col items-center justify-center gap-2 px-2 py-4 text-brand-green bg-brand-light-green/30 hover:bg-brand-light-green/50 transition-colors';

  const content = (
    <>
      {icon}
      <span className="text-xs font-semibold">{label}</span>
    </>
  );

  if (!href) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  return (
    <Link href={href} onClick={onClick} className={className}>
      {content}
    </Link>
  );
}

function MobileDrawer({ open, onClose, pathname }) {
  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <div className={`fixed inset-0 z-[60] md:hidden ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <button
        type="button"
        aria-label="Tutup menu"
        onClick={onClose}
        className={`absolute inset-0 bg-brand-green/40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`absolute inset-y-0 right-0 flex w-[min(100%,22.5rem)] flex-col bg-brand-cream shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-green/15">
          <Link href="/" onClick={onClose} aria-label="Cycle Clothes" className="text-brand-green">
            <Logo className="h-6 w-auto max-w-[180px]" />
          </Link>
          <button type="button" aria-label="Tutup menu" onClick={onClose} className="text-brand-green hover:opacity-70">
            <CloseIcon />
          </button>
        </div>

        <div className="grid grid-cols-3 divide-x divide-brand-green/15 border-b border-brand-green/15">
          <QuickAction
            href="/login"
            label="Masuk"
            onClick={onClose}
            icon={<UserIcon className="h-6 w-6" />}
          />
          <QuickAction
            label="Wishlist"
            onClick={onClose}
            icon={<HeartIcon className="h-6 w-6" />}
          />
          <QuickAction
            href="/donasi"
            label="Donasi"
            onClick={onClose}
            icon={<DonateIcon className="h-6 w-6" />}
          />
        </div>
        <div className="grid grid-cols-2 divide-x divide-brand-green/15 border-b border-brand-green/15">
          <QuickAction
            href="/preloved"
            label="Preloved"
            onClick={onClose}
            icon={<BagIcon className="h-6 w-6" />}
          />
          <QuickAction
            href="/about#contact"
            label="Kontak"
            onClick={onClose}
            icon={<PhoneIcon className="h-6 w-6" />}
          />
        </div>

        <nav className="flex-1 overflow-y-auto">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              aria-current={isActivePath(pathname, link.href) ? 'page' : undefined}
              className="flex items-center justify-between px-5 py-4 text-base font-bold text-brand-green border-b border-brand-green/10 hover:bg-brand-light-green/25"
            >
              {link.label}
              <ChevronIcon className="h-4 w-4 text-brand-green/70" />
            </Link>
          ))}
        </nav>

        <p className="px-5 py-4 text-xs text-brand-green/70 pb-[max(1rem,env(safe-area-inset-bottom))]">
          Bergabung dengan gerakan sustainable fashion.
        </p>
      </aside>
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
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
                <button type="button" aria-label="Cari" className="hidden md:inline-flex hover:opacity-70 transition-opacity">
                  <NavIcon src="/incons/search.svg" alt="" />
                </button>
                <button type="button" aria-label="Wishlist" className="hover:opacity-70 transition-opacity">
                  <NavIcon src="/incons/wishlist.svg" alt="" />
                </button>
                <Link href="/login" aria-label="Akun" className="hidden md:inline-flex hover:opacity-70 transition-opacity text-brand-cream">
                  <UserIcon />
                </Link>
                <button type="button" aria-label="Keranjang belanja" className="relative hover:opacity-70 transition-opacity">
                  <NavIcon src="/incons/bag.svg" alt="" />
                </button>
                <button
                  type="button"
                  aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
                  aria-expanded={mobileOpen}
                  onClick={() => setMobileOpen(true)}
                  className="md:hidden hover:opacity-70 transition-opacity"
                >
                  <NavIcon src="/incons/list.svg" alt="" className="h-7 w-7" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} pathname={pathname} />
    </>
  );
}
