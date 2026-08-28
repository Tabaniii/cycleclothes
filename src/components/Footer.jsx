'use client';

import Link from 'next/link';
import Logo from './Logo';
import { CONTACT_EMAIL } from '@/data/contact';

const LINK_CLASS =
  'w-fit text-sm text-brand-cream/85 transition-colors hover:text-brand-cream hover:underline underline-offset-4 decoration-brand-light-green';

const NAV_COLUMNS = [
  {
    title: 'Jelajah',
    links: [
      { label: 'Donasi', href: '/donasi' },
      { label: 'Preloved', href: '/preloved' },
      { label: 'Instagram', href: 'https://instagram.com' },
      { label: 'WhatsApp', href: 'https://wa.me/' },
    ],
  },
  {
    title: 'Perusahaan',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Home', href: '/' },
      { label: 'Email', href: `mailto:${CONTACT_EMAIL}` },
    ],
  },
  {
    title: 'Bantuan',
    links: [
      { label: 'Panduan Donasi', href: '/donasi' },
      { label: 'Syarat & Ketentuan Preloved', href: '/preloved' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Kebijakan Privasi', href: '/kebijakan-privasi' },
    ],
  },
];

function FooterLink({ href, label }) {
  const isExternal = href.startsWith('http') || href.startsWith('mailto:');

  if (isExternal) {
    return (
      <a
        href={href}
        className={LINK_CLASS}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel={href.startsWith('http') ? 'noreferrer' : undefined}
      >
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={LINK_CLASS}>
      {label}
    </Link>
  );
}

function BackToTop() {
  function handleClick() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-fit text-sm text-brand-cream/85 transition-colors hover:text-brand-cream hover:underline underline-offset-4 decoration-brand-light-green"
    >
      Back to top ↑
    </button>
  );
}

export default function Footer() {
  return (
    <footer className="flex flex-1 flex-col bg-brand-green md:block md:flex-none">
      <div className="mx-auto w-full max-w-7xl px-6 pt-8 md:px-8 md:pt-20 lg:px-12 lg:pt-24">
        <div className="flex flex-col gap-7 md:gap-14 lg:flex-row lg:items-start lg:justify-between lg:gap-20">
          <div className="flex items-baseline gap-2 whitespace-nowrap md:hidden">
            <span className="text-3xl font-bold leading-none text-brand-cream">Let&apos;s</span>
            <span className="font-script text-4xl leading-none text-brand-light-green">Cycle.</span>
          </div>

          <div className="hidden max-w-md shrink-0 md:block">
            <h2 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold leading-none text-brand-cream">
              Let&apos;s
            </h2>
            <p className="mt-1 font-script text-5xl sm:text-6xl lg:text-7xl leading-[0.85] text-brand-light-green">
              Cycle.
            </p>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-brand-cream/80">
              Bergabung dengan gerakan sustainable fashion.
            </p>
            <p className="mt-4 text-xs uppercase tracking-[0.22em] text-brand-light-green">
              Open for donation
            </p>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-3 md:gap-12 lg:gap-16 lg:pt-2">
            {NAV_COLUMNS.map((column) => (
              <nav key={column.title} className="flex flex-col gap-2.5 md:gap-3">
                <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-brand-cream">
                  {column.title}
                </h3>
                {column.links.map((link) => (
                  <FooterLink key={link.label} {...link} />
                ))}
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-16 sm:mt-20 hidden md:flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-xl text-sm leading-relaxed italic text-brand-cream/80">
            “Setiap helai pakaian yang didonasikan mengurangi jejak karbon dan memperpanjang umur tekstil.”
          </p>
          <span className="inline-flex w-fit items-center rounded-full border border-brand-light-green/50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-light-green">
            100% Eco-Conscious Initiative
          </span>
        </div>

        <div className="mt-10 sm:mt-12 pb-2 sm:pb-4 hidden md:block">
          <Logo className="block h-auto w-full overflow-visible text-brand-cream" />
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-brand-cream/20 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:mt-0 md:flex-row md:items-center md:justify-between md:pt-6">
          <p className="text-sm text-brand-cream/70">
            © {new Date().getFullYear()} Cycle Clothes. Built for sustainable impact.
          </p>
          <BackToTop />
        </div>
      </div>
    </footer>
  );
}
