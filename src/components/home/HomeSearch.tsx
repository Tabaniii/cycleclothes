'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export function HomeSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    router.push(value ? `/donasi?q=${encodeURIComponent(value)}` : '/donasi');
  }

  return (
    <form onSubmit={onSubmit} className="relative mx-auto w-full max-w-2xl">
      <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-brand-green/50">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3-3" strokeLinecap="round" />
        </svg>
      </span>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="What happened"
        aria-label="Cari kebutuhan donasi"
        className="h-14 w-full rounded-full bg-white pl-14 pr-5 text-base text-brand-green shadow-sm placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-light-green"
      />
      <button type="submit" className="sr-only">
        Cari
      </button>
    </form>
  );
}
