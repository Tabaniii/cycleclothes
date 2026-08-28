'use client';

import { useState } from 'react';
import { CONTACT_EMAIL } from '@/data/contact';

export default function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const subject = encodeURIComponent(`Pesan dari ${form.name || 'pengunjung'} — Cycle Clothes`);
    const body = encodeURIComponent(
      `${form.message}\n\n—\n${form.name}\n${form.email}`,
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  }

  const fieldClass =
    'w-full rounded-xl border border-brand-cream-dark/40 bg-white px-4 py-3 text-sm text-brand-green outline-none transition-colors placeholder:text-gray-400 focus:border-brand-green';

  return (
    <section id="contact" className="bg-white">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-14 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-cream-dark mb-3">
              Contact
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-green leading-tight">
              Kirim email ke kami
            </h2>
            <p className="mt-4 max-w-md text-gray-600 leading-relaxed">
              Mau ngobrol tentang donasi, preloved, atau kolaborasi? Isi form di samping, atau drop email
              langsung ke tautan di bawah.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl bg-brand-cream p-5 sm:p-7 border border-brand-cream-dark/30 flex flex-col gap-4"
          >
            <div>
              <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium text-brand-green">
                Nama
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="Nama kamu"
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium text-brand-green">
                Email
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="nama@email.com"
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium text-brand-green">
                Pesan
              </label>
              <textarea
                id="contact-message"
                name="message"
                required
                rows={4}
                value={form.message}
                onChange={handleChange}
                placeholder="Tulis pesan kamu..."
                className={`${fieldClass} resize-y min-h-[7rem]`}
              />
            </div>
            <button
              type="submit"
              className="mt-1 inline-flex items-center justify-center rounded-full bg-brand-green px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-brand-cream transition-colors hover:bg-brand-green/90"
            >
              Kirim Email
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
