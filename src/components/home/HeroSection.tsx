'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  HeartHandshake,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  PackageCheck,
  Leaf,
  ChevronDown,
  CheckCircle2,
  Tag,
} from 'lucide-react';

export function HeroSection() {
  const [activePin, setActivePin] = useState<number | null>(null);
  const [highlightMode, setHighlightMode] = useState<'all' | 'donation' | 'preloved'>('all');

  return (
    <section className="relative isolate overflow-hidden px-4 pt-4 pb-12 sm:px-8 sm:pt-8 lg:px-10 lg:pb-16">
      {/* Ambient background glow for depth and warmth */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 left-1/2 -z-10 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-brand-light-green/15 blur-[130px] sm:h-[680px] sm:w-[680px] animate-hero-glow"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-1/4 -z-10 h-[400px] w-[400px] rounded-full bg-brand-cream/10 blur-[110px]"
      />

      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        {/* Left Column: Inspiring Copy & Actions */}
        <div className="flex flex-col items-start text-left">
          {/* Top category pill */}
          <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-brand-cream/25 bg-brand-cream/10 px-3 py-1.5 backdrop-blur-md transition-all hover:bg-brand-cream/15 sm:px-3.5">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-light-green opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-light-green" />
            </span>
            <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-brand-cream sm:text-xs">
              Fashion Sirkular & Donasi Tepercaya
            </span>
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-brand-light-green" />
          </div>

          {/* Main Title */}
          <h1 className="mt-4 text-[2.5rem] font-extrabold uppercase leading-[0.98] tracking-tight text-white sm:mt-5 sm:text-5xl lg:text-[3.75rem]">
            Semua berawal <br />
            <span className="text-brand-cream">dari </span>
            <span className="font-instrument italic font-normal text-brand-light-green capitalize">
              lemarimu.
            </span>
          </h1>

          {/* Persuasive Subtitle */}
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-brand-cream/85 sm:mt-5 sm:text-base lg:text-lg">
            Setiap helai pakaian punya cerita yang belum usai. Salurkan pakaian layak pakai
            langsung ke yayasan terverifikasi tanpa perantara, atau temukan koleksi preloved
            berkualitas dengan transaksi aman.
          </p>

          {/* Dual CTAs */}
          <div className="mt-7 flex w-full flex-col gap-3 sm:mt-8 sm:w-auto sm:flex-row sm:items-center">
            <Link
              href="/donasi"
              onMouseEnter={() => setHighlightMode('donation')}
              onMouseLeave={() => setHighlightMode('all')}
              className={`group inline-flex items-center justify-center gap-2.5 rounded-full bg-brand-cream px-7 py-3.5 text-sm font-bold text-brand-green shadow-[0_10px_30px_rgba(216,212,184,0.25)] transition-all duration-300 hover:bg-[#e6e2cb] hover:shadow-[0_14px_38px_rgba(216,212,184,0.38)] hover:-translate-y-0.5 active:translate-y-0 ${
                highlightMode === 'donation' ? 'ring-4 ring-brand-light-green/40' : ''
              }`}
            >
              <HeartHandshake className="h-4 w-4 transition-transform group-hover:scale-110" />
              <span>Mulai Donasi</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/preloved"
              onMouseEnter={() => setHighlightMode('preloved')}
              onMouseLeave={() => setHighlightMode('all')}
              className={`group inline-flex items-center justify-center gap-2.5 rounded-full border border-brand-cream/35 bg-brand-cream/10 px-6 py-3.5 text-sm font-semibold text-brand-cream backdrop-blur-md transition-all duration-300 hover:bg-brand-cream/20 hover:border-brand-cream/60 hover:-translate-y-0.5 active:translate-y-0 ${
                highlightMode === 'preloved' ? 'ring-4 ring-brand-cream/30' : ''
              }`}
            >
              <ShoppingBag className="h-4 w-4 text-brand-light-green transition-transform group-hover:scale-110" />
              <span>Jelajahi Preloved</span>
            </Link>
          </div>

          {/* Secondary Quick Anchor */}
          <div className="mt-3.5 flex flex-wrap items-center gap-1.5 text-xs font-medium text-brand-cream/70 sm:mt-4 sm:gap-2">
            <span>Ingin tahu dampak pakaian tak terpakai?</span>
            <Link
              href="#about-fast-fashion"
              className="inline-flex items-center gap-1 font-semibold text-brand-light-green underline-offset-4 hover:underline"
            >
              <span>Pelajari Fast Fashion</span>
              <ChevronDown className="h-3 w-3" />
            </Link>
          </div>

          {/* Social Proof & Trust Metrics Bar */}
          <div className="mt-8 grid w-full grid-cols-3 gap-1.5 rounded-2xl border border-brand-cream/15 bg-brand-green/50 p-2.5 backdrop-blur-md transition-colors hover:border-brand-cream/30 sm:mt-9 sm:gap-4 sm:p-4">
            <div className="flex flex-col items-center border-r border-brand-cream/15 px-1 text-center sm:items-start sm:px-2 sm:text-left">
              <div className="flex items-center gap-1 text-brand-light-green sm:gap-1.5">
                <PackageCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-sm font-extrabold text-white sm:text-lg">1.200+</span>
              </div>
              <span className="mt-0.5 text-[9px] leading-tight text-brand-cream/75 sm:text-xs">
                Pakaian Tersalurkan
              </span>
            </div>

            <div className="flex flex-col items-center border-r border-brand-cream/15 px-1 text-center sm:items-start sm:px-2 sm:text-left">
              <div className="flex items-center gap-1 text-brand-light-green sm:gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-sm font-extrabold text-white sm:text-lg">15+</span>
              </div>
              <span className="mt-0.5 text-[9px] leading-tight text-brand-cream/75 sm:text-xs">
                Mitra Yayasan Resmi
              </span>
            </div>

            <div className="flex flex-col items-center px-1 text-center sm:items-start sm:px-2 sm:text-left">
              <div className="flex items-center gap-1 text-brand-light-green sm:gap-1.5">
                <Leaf className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-sm font-extrabold text-white sm:text-lg">100%</span>
              </div>
              <span className="mt-0.5 text-[9px] leading-tight text-brand-cream/75 sm:text-xs">
                Dampak Berkelanjutan
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Editorial Visual Showcase with Floating Cards */}
        <div className="relative mx-auto mt-4 w-full max-w-lg sm:mt-6 lg:mt-0 lg:max-w-none">
          {/* Main Visual Frame */}
          <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] border border-brand-cream/25 bg-neutral-900 shadow-2xl transition-all duration-500 hover:border-brand-cream/45 sm:aspect-[5/4] sm:rounded-[2.75rem]">
            <Image
              src="/home/hero-rack.jpg"
              alt="Koleksi Pakaian Berkelanjutan di CycleClothes"
              fill
              priority
              fetchPriority="high"
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 42vw"
            />

            {/* Gradient Scrims for text contrast & mood */}
            <div className="absolute inset-0 bg-gradient-to-t from-brand-green/80 via-transparent to-black/20 pointer-events-none" />
            <div className="absolute inset-0 bg-brand-light-green/10 mix-blend-overlay pointer-events-none" />

            {/* Interactive Hotspot Pin 1 (Sweater) */}
            <div
              className="absolute left-[26%] top-[34%] z-20 cursor-pointer"
              onMouseEnter={() => setActivePin(1)}
              onMouseLeave={() => setActivePin(null)}
              onClick={() => setActivePin(activePin === 1 ? null : 1)}
            >
              <div className="relative flex items-center justify-center">
                <span className="absolute h-6 w-6 animate-ping rounded-full bg-brand-cream/60" />
                <button
                  type="button"
                  aria-label="Informasi Sweater Rajut"
                  className="relative flex h-5 w-5 items-center justify-center rounded-full bg-brand-cream text-[10px] font-bold text-brand-green shadow-md transition-transform hover:scale-125"
                >
                  +
                </button>
              </div>

              {activePin === 1 && (
                <div className="absolute left-6 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl border border-brand-cream/30 bg-brand-green/95 px-3 py-2 text-xs text-brand-cream shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-1.5 font-semibold text-white">
                    <Tag className="h-3 w-3 text-brand-light-green" />
                    <span>Sweater Rajut Forest</span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-brand-light-green">
                    Preloved Terkurasi · Rp 85.000 · Seperti Baru
                  </p>
                </div>
              )}
            </div>

            {/* Interactive Hotspot Pin 2 (Jacket / Linen) */}
            <div
              className="absolute left-[54%] top-[40%] z-20 cursor-pointer"
              onMouseEnter={() => setActivePin(2)}
              onMouseLeave={() => setActivePin(null)}
              onClick={() => setActivePin(activePin === 2 ? null : 2)}
            >
              <div className="relative flex items-center justify-center">
                <span className="absolute h-6 w-6 animate-ping rounded-full bg-brand-light-green/60" />
                <button
                  type="button"
                  aria-label="Informasi Jaket Donasi"
                  className="relative flex h-5 w-5 items-center justify-center rounded-full bg-brand-light-green text-[10px] font-bold text-brand-green shadow-md transition-transform hover:scale-125"
                >
                  +
                </button>
              </div>

              {activePin === 2 && (
                <div className="absolute left-6 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl border border-brand-cream/30 bg-brand-green/95 px-3 py-2 text-xs text-brand-cream shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-1.5 font-semibold text-white">
                    <HeartHandshake className="h-3 w-3 text-brand-light-green" />
                    <span>Jaket Utilitas Katun</span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-brand-light-green">
                    Donasi Terverifikasi · Layak Pakai · Siap Salur
                  </p>
                </div>
              )}
            </div>

            {/* Clean bottom-right aesthetic pill tag */}
            <div className="absolute right-3.5 bottom-3.5 z-10 flex items-center gap-1.5 rounded-full border border-brand-cream/25 bg-brand-green/85 px-3 py-1 text-[10px] font-medium text-brand-cream shadow-lg backdrop-blur-md sm:right-4 sm:bottom-4 sm:gap-2 sm:px-3.5 sm:py-1.5 sm:text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-light-green" />
              <span>100% Circular Fashion</span>
            </div>
          </div>

          {/* Floating Glass Card 1 (Top-Right: Preloved Highlight) */}
          <Link
            href="/preloved"
            className={`animate-hero-float absolute -top-4 -right-2 z-20 flex items-center gap-2.5 rounded-2xl border border-brand-cream/30 bg-brand-green/90 p-2.5 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-105 sm:-top-7 sm:-right-5 sm:gap-3 sm:p-3.5 ${
              highlightMode === 'preloved'
                ? 'ring-2 ring-brand-light-green shadow-[0_0_25px_rgba(193,193,119,0.4)]'
                : ''
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-light-green/20 text-brand-light-green sm:h-10 sm:w-10">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <p className="text-[11px] font-bold text-brand-cream sm:text-xs">Kurasi Pilihan</p>
                <CheckCircle2 className="h-3 w-3 text-brand-light-green" />
              </div>
              <p className="text-[9px] text-brand-light-green sm:text-[10px]">Kondisi 9.5/10 · Terawat</p>
            </div>
          </Link>

          {/* Floating Glass Card 2 (Bottom-Left: Donation Progress Highlight) */}
          <Link
            href="/donasi"
            className={`animate-hero-float-reverse absolute -bottom-5 -left-2 z-20 flex w-60 items-center gap-2.5 rounded-2xl border border-brand-cream/30 bg-brand-green/95 p-2.5 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-105 sm:-bottom-8 sm:-left-6 sm:w-72 sm:gap-3 sm:p-3.5 ${
              highlightMode === 'donation'
                ? 'ring-2 ring-brand-light-green shadow-[0_0_25px_rgba(193,193,119,0.4)]'
                : ''
            }`}
          >
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-brand-cream/25 sm:h-12 sm:w-12">
              <Image
                src="/home/hero-package.jpg"
                alt="Paket Pakaian Terverifikasi"
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
                <span className="truncate font-semibold text-brand-cream">Panti Bina Nusa</span>
                <span className="font-bold text-brand-light-green">92%</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/15 sm:mt-1.5">
                <div
                  className="h-full rounded-full bg-brand-light-green transition-all"
                  style={{ width: '92%' }}
                />
              </div>
              <p className="mt-0.5 text-[8.5px] text-brand-cream/70 sm:mt-1 sm:text-[9px]">
                46/50 pakaian donasi terkumpul
              </p>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
