import Image from 'next/image';
import Link from 'next/link';
import type { DonationWishlist } from '@/types/database';
import { ClothesRack } from '@/components/home/ClothesRack';
import { HomeSearch } from '@/components/home/HomeSearch';

const FAST_FASHION = [
  {
    title: 'The Cost',
    body: 'Understanding the environmental toll of mass production.',
    icon: 'factory' as const,
  },
  {
    title: 'The Standard',
    body: 'Where do discarded garments really end up?',
    icon: 'seal' as const,
  },
  {
    title: 'The Waste',
    body: 'Certifications and materials that matter.',
    icon: 'recycle' as const,
  },
];

const FALLBACK_CAMPAIGNS = [
  { title: 'Bantuan orang kebanjiran', meta: 'Terkumpul  ·  USD 100', href: '/donasi' },
  { title: 'Bantuan orang kebanjiran', meta: 'Terkumpul  ·  USD 100', href: '/donasi' },
  { title: 'Bantuan orang kebanjiran', meta: 'Terkumpul  ·  USD 100', href: '/donasi' },
];

function FastFashionIcon({ name }: { name: (typeof FAST_FASHION)[number]['icon'] }) {
  const common = 'h-10 w-10 stroke-brand-green';
  if (name === 'factory') {
    return (
      <svg viewBox="0 0 32 32" fill="none" className={common} strokeWidth="1.7">
        <path d="M4 28V14l6 4V14l6 4V8h4v6h8v14H4Z" />
        <path d="M8 28v-4h4v4M16 28v-4h4v4M24 28v-4h4v4" />
      </svg>
    );
  }
  if (name === 'seal') {
    return (
      <svg viewBox="0 0 32 32" fill="none" className={common} strokeWidth="1.7">
        <path d="M16 4l2.4 4.8 5.4.8-3.9 3.8.9 5.4L16 16.6 11.2 19l.9-5.4-3.9-3.8 5.4-.8L16 4Z" />
        <circle cx="16" cy="16" r="10" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" fill="none" className={common} strokeWidth="1.7">
      <path d="M7 18a9 9 0 0 1 15.5-6.4" strokeLinecap="round" />
      <path d="M25 14a9 9 0 0 1-15.6 6.5" strokeLinecap="round" />
      <path d="M22 6v6h6M10 26v-6H4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HomeLanding({ campaigns }: { campaigns: DonationWishlist[] }) {
  const cards =
    campaigns.length > 0
      ? campaigns.slice(0, 3).map((item) => ({
          title: item.title,
          meta: `Terkumpul  ·  ${item.fulfilled_items}/${item.target_items} item`,
          href: `/donasi/${item.id}`,
        }))
      : [...FALLBACK_CAMPAIGNS];

  while (cards.length < 3) {
    cards.push(FALLBACK_CAMPAIGNS[cards.length % FALLBACK_CAMPAIGNS.length]);
  }

  return (
    <div className="bg-brand-green text-brand-cream">
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-6 pb-6 pt-10 sm:px-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:gap-4 lg:px-10 lg:pt-12">
        <div>
          <h1 className="max-w-xl text-[2.6rem] font-extrabold uppercase leading-[0.95] tracking-tight sm:text-5xl lg:text-[3.35rem]">
            Semua berawal
            <br />
            dari lemarimu
          </h1>
          <Link
            href="#about-fast-fashion"
            className="mt-8 inline-flex items-center rounded-full border border-brand-cream/80 px-5 py-2 text-sm font-semibold text-brand-cream transition-colors hover:bg-brand-cream hover:text-brand-green"
          >
            Jelajahi →
          </Link>
        </div>
        <ClothesRack className="mx-auto w-full max-w-xl text-brand-cream" />
      </section>

      <section id="about-fast-fashion" className="scroll-mt-28 mx-auto max-w-6xl px-6 pb-14 pt-4 sm:px-8 lg:px-10">
        <h2 className="text-center text-3xl font-extrabold uppercase tracking-wide sm:text-4xl lg:text-5xl">
          About fast fashion
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {FAST_FASHION.map((item) => (
            <article
              key={item.title}
              className="flex min-h-[30rem] flex-col rounded-[1.75rem] bg-brand-light-green px-6 pb-8 pt-8 text-brand-green sm:min-h-[32rem]"
            >
              <div className="flex flex-col items-center text-center">
                <FastFashionIcon name={item.icon} />
                <h3 className="mt-4 text-sm font-extrabold uppercase tracking-[0.14em]">{item.title}</h3>
                <p className="mt-2 max-w-[16rem] text-xs leading-relaxed text-brand-green/80">{item.body}</p>
              </div>
              <div className="mt-8 flex flex-1 items-center justify-center">
                <p className="text-xs text-brand-green/45">(video tiktok)</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-12 sm:px-8 lg:px-10">
        <HomeSearch />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {cards.map((card, index) => (
            <Link
              key={`${card.href}-${index}`}
              href={card.href}
              className="group relative isolate aspect-[5/4] overflow-hidden rounded-2xl"
            >
              <Image
                src="/home/flood.jpg"
                alt=""
                fill
                priority={index === 0}
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width:640px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-brand-light-green/35 mix-blend-multiply" />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-green/90 via-brand-green/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-lg font-semibold leading-tight">{card.title}</p>
                <p className="mt-1 text-xs text-brand-cream/85">{card.meta}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20 sm:px-8 lg:px-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-3xl font-extrabold uppercase tracking-wide sm:text-4xl">
            Where can I donate?
          </h2>
          <Link
            href="/donasi"
            className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-cream/80 hover:text-brand-cream"
          >
            View all location
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-[1.7fr_1fr]">
          <Link href="/donasi" className="group relative isolate min-h-[22rem] overflow-hidden rounded-[1.75rem]">
            <Image
              src="/home/parcel.jpg"
              alt=""
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width:1024px) 100vw, 65vw"
            />
            <div className="absolute inset-0 bg-brand-light-green/20 mix-blend-multiply" />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-green/75 via-brand-green/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <h3 className="font-script text-4xl text-brand-cream sm:text-5xl">Prepare Your Parcel</h3>
              <p className="mt-2 max-w-md text-sm text-brand-cream/90">
                Ensure items are clean and gently used. Pack them securely for their next journey.
              </p>
              <span className="mt-3 inline-block text-xs font-semibold tracking-[0.04em] text-brand-cream/80">
                Read More
              </span>
            </div>
          </Link>

          <div className="relative isolate min-h-[22rem] overflow-hidden rounded-[1.75rem] bg-brand-light-green">
            <p className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 text-xs text-brand-green/45">
              (google maps)
            </p>
            <div className="absolute bottom-6 left-6 text-brand-green">
              <p className="flex items-start gap-2 text-sm font-semibold">
                <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0" fill="currentColor" aria-hidden>
                  <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
                </svg>
                Nearest Drop-off
              </p>
              <p className="mt-1 pl-7 text-xs text-brand-green/80">Central Hall, Sudirman</p>
              <p className="pl-7 text-xs text-brand-green/65">Open until 18:00</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
