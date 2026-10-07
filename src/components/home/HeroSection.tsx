'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, HeartHandshake, ShoppingBag, ChevronDown } from 'lucide-react';

const STATS = [
  { value: 1200, suffix: '+', label: 'Pakaian Tersalurkan' },
  { value: 15, suffix: '+', label: 'Mitra Yayasan' },
  { value: 100, suffix: '%', label: 'Dampak Berkelanjutan' },
];

function CountUp({
  to,
  suffix = '',
  duration = 1500,
}: {
  to: number;
  suffix?: string;
  duration?: number;
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      setValue(to);
      return;
    }

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(to * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);

  return (
    <span>
      {value.toLocaleString('id-ID')}
      {suffix}
    </span>
  );
}

export function HeroSection() {
  return (
    <section className="relative isolate flex min-h-[calc(100dvh-5rem)] flex-col justify-between overflow-hidden px-6 py-8 sm:px-10 sm:py-12 lg:px-16 lg:py-14">
      {/* Subtle ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[550px] w-[550px] -translate-x-1/2 rounded-full bg-brand-light-green/10 blur-[140px]"
      />

      <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
        {/* Left Column: Copy & Actions */}
        <div className="flex flex-col items-start text-left lg:col-span-7">
          {/* Category Kicker */}
          <div className="inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-brand-light-green">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-light-green" />
            <span>Fashion Sirkular & Donasi</span>
          </div>

          {/* Headline */}
          <h1 className="mt-4 text-4xl font-extrabold uppercase leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl [text-wrap:balance]">
            Semua berawal{' '}
            <span className="block text-brand-cream">
              dari{' '}
              <span className="font-instrument italic font-normal text-brand-light-green capitalize">
                lemarimu.
              </span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-brand-cream/80 sm:text-base lg:text-lg [text-wrap:pretty]">
            Salurkan pakaian layak pakai langsung ke yayasan terverifikasi tanpa perantara, atau
            temukan koleksi preloved berkualitas dengan transaksi aman.
          </p>

          {/* Actions */}
          <div className="mt-8 flex w-full flex-col gap-3.5 sm:w-auto sm:flex-row sm:items-center">
            <Link
              href="/donasi"
              className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-brand-cream px-7 py-3.5 text-sm font-bold text-brand-green shadow-md transition-all duration-200 hover:bg-white hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
            >
              <HeartHandshake className="h-4 w-4 transition-transform group-hover:scale-110" />
              <span>Mulai Donasi</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/preloved"
              className="group inline-flex items-center justify-center gap-2.5 rounded-full border border-brand-cream/30 bg-brand-cream/5 px-6 py-3.5 text-sm font-semibold text-brand-cream backdrop-blur-sm transition-all duration-200 hover:border-brand-cream/60 hover:bg-brand-cream/15 hover:-translate-y-0.5 active:translate-y-0"
            >
              <ShoppingBag className="h-4 w-4 text-brand-light-green transition-transform group-hover:scale-110" />
              <span>Jelajahi Preloved</span>
            </Link>
          </div>

          {/* Minimalist Metrics */}
          <div className="mt-12 grid w-full max-w-lg grid-cols-3 gap-6 border-t border-brand-cream/15 pt-6">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                  <CountUp to={stat.value} suffix={stat.suffix} />
                </span>
                <span className="mt-1 text-xs text-brand-cream/70 sm:text-xs">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Clean Editorial Visual Showcase */}
        <div className="relative mx-auto w-full max-w-md lg:col-span-5 lg:max-w-none">
          <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-brand-cream/20 bg-neutral-900 shadow-2xl transition-all duration-500 hover:border-brand-cream/40 sm:aspect-[5/4] lg:aspect-[4/5]">
            <Image
              src="/home/hero-rack.jpg"
              alt="Koleksi Pakaian Berkelanjutan di CycleClothes"
              fill
              priority
              fetchPriority="high"
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
            />
            {/* Subtle Gradient Scrim for Visual Depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-brand-green/60 via-transparent to-transparent pointer-events-none" />

            {/* Minimalist Badge Tag */}
            <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 rounded-full border border-brand-cream/20 bg-brand-green/80 px-3.5 py-1.5 text-xs text-brand-cream backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-light-green" />
              <span className="font-medium">100% Circular Fashion</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Scroll Indicator */}
      <div className="mt-6 flex items-center justify-center">
        <Link
          href="#about-fast-fashion"
          aria-label="Scroll ke bagian About Fast Fashion"
          className="group inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-brand-cream/60 transition-colors hover:text-brand-cream"
        >
          <span>Eksplorasi</span>
          <ChevronDown className="h-4 w-4 text-brand-light-green transition-transform duration-300 group-hover:translate-y-0.5" />
        </Link>
      </div>
    </section>
  );
}

