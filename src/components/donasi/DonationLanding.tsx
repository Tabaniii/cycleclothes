'use client';

import { FormEvent, useEffect, useMemo, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { DonationWishlist, Paginated } from '@/types/database';

type CharityCard = {
  id: string;
  href: string;
  type: string;
  name: string;
  address: string;
  phone: string;
  image: string;
  needsDonation: boolean;
  objectPosition?: string;
};

type ImpactPhoto = {
  src: string;
  alt: string;
  objectPosition?: string;
};

const IMPACT_PHOTOS: ImpactPhoto[] = [
  { src: '/assets/images/impact-1.jpg', alt: 'Wilayah terdampak bencana', objectPosition: 'left center' },
  { src: '/assets/images/impact-2.jpg', alt: 'Bangunan yang rusak dan membutuhkan bantuan', objectPosition: 'center' },
  { src: '/assets/images/impact-3.jpg', alt: 'Bantuan pakaian untuk disalurkan', objectPosition: 'center' },
];

const CHARITY_IMAGES = [
  '/assets/images/charity-1.jpg',
  '/assets/images/charity-2.jpg',
  '/assets/images/charity-3.jpg',
];

const FALLBACK_CHARITIES: CharityCard[] = [
  {
    id: 'bina-nusa',
    href: '/donasi',
    type: 'Panti Asuhan',
    name: 'Bina Nusa',
    address: 'Jl. Kartanajaya, Kutoyoso, Kec. Perbaya, Kab. Jogokuto',
    phone: '+62 0378 878 / 79 098 123',
    image: CHARITY_IMAGES[0],
    needsDonation: true,
    objectPosition: 'center 35%',
  },
  {
    id: 'sinar-kota',
    href: '/donasi',
    type: 'Panti Jompo',
    name: 'Sinar Kota',
    address: 'Jl. Kartanajaya, Kutoyoso, Kec. Perbaya, Kab. Jogokuto',
    phone: '+62 0378 878 / 79 098 123',
    image: CHARITY_IMAGES[1],
    needsDonation: true,
    objectPosition: '20% 40%',
  },
  {
    id: 'harapan-anak',
    href: '/donasi',
    type: 'Panti Asuhan',
    name: 'Harapan Anak',
    address: 'Perbaya, Kab. Jogokuto',
    phone: '+62 0378 878 / 79 098 123',
    image: CHARITY_IMAGES[2],
    needsDonation: true,
    objectPosition: '80% 30%',
  },
];

const PILL_CLASS =
  'inline-flex min-w-[16rem] items-center justify-center rounded-full bg-brand-cream px-8 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand-green transition-colors hover:bg-brand-cream/90 sm:text-sm';

function splitOrgName(legalName: string) {
  const prefixes = ['Panti Asuhan', 'Panti Jompo', 'Yayasan'];
  const match = prefixes.find((prefix) => legalName.toLowerCase().startsWith(prefix.toLowerCase()));
  if (!match) return { type: 'Yayasan', name: legalName };
  return { type: match, name: legalName.slice(match.length).trim() || legalName };
}

function charityTypeFromWishlist(wishlist: DonationWishlist, legalName: string) {
  const haystack = `${wishlist.category || ''} ${legalName} ${wishlist.title}`.toLowerCase();
  if (haystack.includes('jompo') || haystack.includes('lansia')) return 'Panti Jompo';
  if (wishlist.category === 'anak' || haystack.includes('panti') || haystack.includes('asuhan')) {
    return 'Panti Asuhan';
  }
  return splitOrgName(legalName).type;
}

function mapWishlist(wishlist: DonationWishlist, index: number): CharityCard {
  const legalName =
    wishlist.foundation_profiles?.legal_name || wishlist.profiles?.full_name || wishlist.title;
  const split = splitOrgName(legalName);
  return {
    id: wishlist.id,
    href: `/donasi/${wishlist.id}`,
    type: charityTypeFromWishlist(wishlist, legalName),
    name: split.name,
    address: wishlist.foundation_profiles?.address || wishlist.profiles?.city || 'Lokasi menyusul',
    phone: wishlist.foundation_profiles?.pic_phone || 'Hubungi yayasan',
    image: CHARITY_IMAGES[index % CHARITY_IMAGES.length],
    needsDonation: wishlist.status === 'open',
    objectPosition: index % 3 === 1 ? 'left center' : index % 3 === 2 ? 'right center' : 'center',
  };
}

function wrapIndex(index: number, length: number) {
  if (length === 0) return 0;
  return (index + length) % length;
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mt-0.5 h-3.5 w-3.5 shrink-0" fill="currentColor" aria-hidden>
      <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mt-0.5 h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.6 4.8h2.3l1.1 2.8-1.5 1.5a12.6 12.6 0 0 0 5.4 5.4l1.5-1.5 2.8 1.1v2.3c0 .7-.5 1.3-1.2 1.4A15.2 15.2 0 0 1 5.2 6c.1-.7.7-1.2 1.4-1.2Z"
      />
    </svg>
  );
}

export function DonationLanding() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<DonationWishlist[]>([]);
  const [query, setQuery] = useState(() => searchParams.get('q') || '');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [impactIndex, setImpactIndex] = useState(1);
  const [charityIndex, setCharityIndex] = useState(0);

  async function load(nextQuery = query, nextSort = sort) {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ status: 'open', limit: '12', sort: nextSort });
      if (nextQuery) params.set('q', nextQuery);
      const res = await fetch(`/api/wishlists?${params.toString()}`);
      const body = (await res.json()) as Paginated<DonationWishlist> & { error?: string };
      if (!res.ok) throw new Error(body.error || 'Gagal memuat donasi.');
      setItems(body.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat donasi.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const nextQuery = searchParams.get('q') || '';
    setQuery(nextQuery);
    load(nextQuery, sort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, sort]);

  const charities = useMemo(() => {
    const mapped = items.map(mapWishlist);
    if (mapped.length > 0) return mapped;
    if (query.trim()) return [];
    return FALLBACK_CHARITIES;
  }, [items, query]);

  useEffect(() => {
    setCharityIndex(0);
  }, [charities]);

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    load(query.trim(), sort);
  }

  const currentCharity = charities[wrapIndex(charityIndex, charities.length)];

  return (
    <div className="bg-brand-green text-brand-cream">
      <section className="mx-auto max-w-6xl px-6 pb-8 pt-8 sm:px-8 sm:pt-10 lg:px-10">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
          <form onSubmit={onSearch} className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-brand-green/45">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3-3" strokeLinecap="round" />
              </svg>
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="What are you looking for"
              aria-label="Cari kebutuhan donasi"
              className="h-12 w-full rounded-full bg-white pl-14 pr-5 text-sm text-brand-green shadow-sm placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-light-green sm:h-14 sm:text-base"
            />
            <button type="submit" className="sr-only">
              Cari
            </button>
          </form>
          <label className="relative shrink-0">
            <span className="sr-only">Urutkan</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="h-10 appearance-none rounded-full bg-brand-cream py-2 pl-4 pr-9 text-[11px] font-medium text-brand-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-light-green sm:text-xs"
            >
              <option value="newest">Sort : Newest</option>
              <option value="oldest">Sort : Oldest</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-green">
              ▾
            </span>
          </label>
        </div>

        <div className="relative mt-8 isolate overflow-hidden rounded-[1.75rem] sm:mt-10 sm:rounded-[2rem]">
          <div className="relative aspect-[16/7] min-h-[12rem] w-full sm:aspect-[21/8] sm:min-h-[16rem]">
            <Image
              src="/assets/images/donation-hero.jpg"
              alt="Tangan yang berbagi kasih"
              fill
              priority
              unoptimized
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 72rem"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-green/10 to-brand-green/50" />
            <div className="absolute inset-0 flex items-center justify-end px-6 py-8 sm:px-12 lg:px-16">
              <h1 className="max-w-md text-right font-instrument text-[1.85rem] italic leading-[1.15] text-brand-cream sm:text-4xl lg:text-[2.75rem]">
                Lets Give Your Clothes a Second Story.
              </h1>
            </div>
          </div>
        </div>

        <p className="mx-auto mt-10 max-w-3xl text-center font-instrument text-lg italic leading-relaxed text-brand-cream/75 sm:mt-12 sm:text-2xl">
          &ldquo;Every piece of clothing you donate helps reduce landfill waste and brings dignity to
          someone in need.&rdquo;
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-2 pb-10 sm:px-8 lg:px-10">
        <PeekCarousel
          length={IMPACT_PHOTOS.length}
          index={impactIndex}
          onIndexChange={setImpactIndex}
          label="Galeri dampak"
        >
          {(offset, position) => {
            const photo = IMPACT_PHOTOS[wrapIndex(impactIndex + offset, IMPACT_PHOTOS.length)];
            return (
              <div
                className={`relative overflow-hidden ${
                  position === 'current'
                    ? 'aspect-[16/9] rounded-[1.75rem] sm:rounded-[2rem]'
                    : 'aspect-[4/5] rounded-[1.5rem] sm:aspect-[5/4]'
                }`}
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  unoptimized
                  className="object-cover"
                  style={{ objectPosition: photo.objectPosition }}
                  sizes={position === 'current' ? '(max-width: 768px) 90vw, 42rem' : '180px'}
                />
              </div>
            );
          }}
        </PeekCarousel>
      </section>

      <div className="flex justify-center px-6 pb-10">
        <a href="#charity" className={PILL_CLASS}>
          Open for charity
        </a>
      </div>

      <section id="charity" className="scroll-mt-28 mx-auto max-w-6xl px-2 pb-6 sm:px-8 lg:px-10" aria-busy={loading}>
        {error ? <p className="mb-4 text-center text-sm text-red-200">{error}</p> : null}
        {!loading && charities.length === 0 ? (
          <p className="mb-4 text-center text-sm text-brand-cream/70">Belum ada yayasan untuk pencarian ini.</p>
        ) : null}
        <PeekCarousel
          length={charities.length}
          index={charityIndex}
          onIndexChange={setCharityIndex}
          label="Yayasan penerima donasi"
        >
          {(offset, position) => {
            const charity = charities[wrapIndex(charityIndex + offset, charities.length)];
            if (!charity) return null;
            if (position !== 'current') {
              return (
                <div className="relative aspect-[5/4] overflow-hidden rounded-[1.5rem] bg-brand-cream p-1.5">
                  <div className="relative h-full overflow-hidden rounded-[1.15rem]">
                    <Image
                      src={charity.image}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover"
                      style={{ objectPosition: charity.objectPosition }}
                      sizes="180px"
                    />
                  </div>
                </div>
              );
            }
            return <CharityFeatureCard charity={charity} />;
          }}
        </PeekCarousel>
      </section>

      <div className="flex justify-center px-6 pb-16 pt-6 sm:pb-20">
        {currentCharity ? (
          <Link href={currentCharity.href} className={PILL_CLASS}>
            Open for donation
          </Link>
        ) : (
          <span className={PILL_CLASS}>Open for donation</span>
        )}
      </div>
    </div>
  );
}

function CharityFeatureCard({ charity }: { charity: CharityCard }) {
  const inner = (
    <article className="relative aspect-[16/9] overflow-hidden rounded-[1.75rem] bg-brand-cream p-1.5 sm:rounded-[2rem] sm:p-2">
      <div className="relative h-full overflow-hidden rounded-[1.35rem] sm:rounded-[1.55rem]">
        <Image
          src={charity.image}
          alt={`${charity.type} ${charity.name}`}
          fill
          unoptimized
          className="object-cover"
          style={{ objectPosition: charity.objectPosition }}
          sizes="(max-width: 768px) 90vw, 42rem"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent pt-24">
          <div className="flex items-end justify-between gap-3 p-4 text-brand-cream sm:p-5">
          <div className="min-w-0">
            <p className="text-xs font-medium sm:text-sm">{charity.type}</p>
            <h2 className="font-instrument text-3xl italic leading-none sm:text-4xl">{charity.name}</h2>
            <p className="mt-3 flex items-start gap-1.5 text-[11px] text-brand-cream/90 sm:text-xs">
              <PinIcon />
              <span>{charity.address}</span>
            </p>
            <p className="mt-1 flex items-start gap-1.5 text-[11px] text-brand-cream/90 sm:text-xs">
              <PhoneIcon />
              <span>{charity.phone}</span>
            </p>
          </div>
          {charity.needsDonation ? (
            <span className="shrink-0 rounded-full bg-brand-green px-3 py-1.5 text-[10px] font-semibold text-brand-cream">
              Need Donation
            </span>
          ) : null}
          </div>
        </div>
      </div>
    </article>
  );

  if (charity.href === '/donasi') return inner;
  return (
    <Link href={charity.href} className="block">
      {inner}
    </Link>
  );
}

function PeekCarousel({
  length,
  index,
  onIndexChange,
  label,
  children,
}: {
  length: number;
  index: number;
  onIndexChange: (index: number) => void;
  label: string;
  children: (offset: number, position: 'prev' | 'current' | 'next') => ReactNode;
}) {
  if (length === 0) return null;

  function go(direction: -1 | 1) {
    onIndexChange(wrapIndex(index + direction, length));
  }

  return (
    <div
      className="grid grid-cols-[minmax(0,0.7fr)_minmax(0,1.7fr)_minmax(0,0.7fr)] items-center gap-2 sm:gap-4"
      aria-roledescription="carousel"
      aria-label={label}
    >
      <button
        type="button"
        onClick={() => go(-1)}
        aria-label="Sebelumnya"
        className="min-w-0 overflow-hidden opacity-80 transition-opacity hover:opacity-100"
      >
        {children(-1, 'prev')}
      </button>
      <div className="min-w-0">{children(0, 'current')}</div>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label="Berikutnya"
        className="min-w-0 overflow-hidden opacity-80 transition-opacity hover:opacity-100"
      >
        {children(1, 'next')}
      </button>
    </div>
  );
}
