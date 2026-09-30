import Image from 'next/image';
import Link from 'next/link';
import type { DonationWishlist } from '@/types/database';
import { HeroSection } from '@/components/home/HeroSection';
import { HomeSearch } from '@/components/home/HomeSearch';
import { DropoffMapLoader } from '@/components/home/DropoffMapLoader';

const FAST_FASHION = [
  {
    title: 'The Cost',
    body: 'Understanding the environmental toll of mass production.',
    icon: '/assets/icons/factory.svg',
  },
  {
    title: 'The Standard',
    body: 'Where do discarded garments really end up?',
    icon: '/assets/icons/verified.svg',
  },
  {
    title: 'The Waste',
    body: 'Certifications and materials that matter.',
    icon: '/assets/icons/recycling.svg',
  },
];

const FALLBACK_CAMPAIGNS = [
  { title: 'Bantuan orang kebanjiran', meta: 'Terkumpul  ·  USD 100', href: '/donasi' },
  { title: 'Bantuan orang kebanjiran', meta: 'Terkumpul  ·  USD 100', href: '/donasi' },
  { title: 'Bantuan orang kebanjiran', meta: 'Terkumpul  ·  USD 100', href: '/donasi' },
];

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
      <HeroSection />

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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.icon} alt="" className="h-10 w-10" />
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
            <DropoffMapLoader />
          </div>
        </div>
      </section>
    </div>
  );
}
