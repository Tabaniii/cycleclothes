import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { TEAM_MEMBERS } from '@/data/team';

export const metadata = {
  title: 'About | Cycle Clothes',
  description:
    'Kenalan dengan orang-orang di balik Cycle Clothes — kelompok yang membangun platform donasi dan preloved fashion.',
};

const VALUES = [
  {
    title: 'Donasi',
    body: 'Pakaian layak pakai disalurkan ke orang yang membutuhkan, bukan ke tempat sampah.',
  },
  {
    title: 'Preloved',
    body: 'Fashion bekas berkualitas mendapat kesempatan kedua lewat jual-beli yang transparan.',
  },
  {
    title: 'Berkelanjutan',
    body: 'Setiap siklus pakaian yang diperpanjang adalah langkah kecil mengurangi limbah tekstil.',
  },
];

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function GitHubIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <Navbar />

      <main className="flex-1">
        <section className="bg-brand-blue">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-16 sm:py-20">
            <p className="text-sm font-semibold tracking-widest uppercase text-brand-cream-dark mb-3">
              About
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold text-white max-w-3xl leading-tight">
              Orang-orang di balik Cycle Clothes
            </h1>
            <p className="mt-4 text-lg text-brand-cream-light max-w-2xl leading-relaxed">
              Kami adalah kelompok yang percaya pakaian layak pakai tidak seharusnya berakhir sebagai limbah.
              Lewat donasi dan preloved, kami ingin fashion punya siklus yang lebih panjang.
            </p>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-14 sm:py-16">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-brand-blue">
                  Cerita kelompok ini
                </h2>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  Cycle Clothes lahir sebagai tugas kelompok dengan tujuan yang lebih besar dari sekadar
                  membuat website. Kami ingin ruang digital di mana orang bisa berbagi pakaian, membeli
                  preloved, dan ikut memperlambat tumpukan limbah tekstil.
                </p>
                <p className="mt-3 text-gray-600 leading-relaxed">
                  Setiap anggota membawa peran yang berbeda — dari tampilan, pengalaman pengguna, sampai
                  sistem di belakang layar. Yang menyatukan kami satu hal: pakaian yang masih bagus pantas
                  bertemu orang yang tepat.
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                {VALUES.map((value) => (
                  <div
                    key={value.title}
                    className="rounded-2xl bg-brand-cream-light p-5 border border-brand-cream-dark/30"
                  >
                    <h3 className="text-lg font-bold text-brand-blue">{value.title}</h3>
                    <p className="mt-2 text-sm text-gray-700 leading-relaxed">{value.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-brand-cream-light">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-14 sm:py-16">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-brand-blue">
                Our Team
              </h2>
              <p className="mt-3 text-gray-700 leading-relaxed">
                One team, one goal: making clothes cycle back to the right people.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {TEAM_MEMBERS.map((member) => (
                <article
                  key={member.name}
                  className="bg-white rounded-2xl shadow-sm border border-brand-cream-dark/20 p-6 flex flex-col"
                >
                  <div className="h-20 w-20 rounded-full bg-brand-blue flex items-center justify-center overflow-hidden border-2 border-brand-cream-dark ring-4 ring-brand-cream-light">
                    {member.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.image}
                        alt={member.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-brand-cream-dark">
                        {getInitials(member.name)}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-5 text-xl font-bold text-brand-blue">{member.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-brand-cream-dark">{member.role}</p>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed flex-1">{member.bio}</p>

                  <blockquote className="mt-4 text-sm italic text-gray-500 border-l-2 border-brand-cream-dark pl-3">
                    “{member.quote}”
                  </blockquote>

                  {member.github ? (
                    <a
                      href={member.github}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-brand-blue hover:opacity-80 transition-opacity"
                    >
                      <GitHubIcon className="h-5 w-5" />
                      GitHub
                    </a>
                  ) : (
                    <div className="mt-5 h-5" />
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-brand-blue">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-brand-cream-light">
            © {new Date().getFullYear()} Cycle Clothes. Dibuat oleh kelompok kami.
          </p>
          <Link href="/" className="text-sm font-medium text-brand-cream-dark hover:opacity-80 transition-opacity">
            Kembali ke Home
          </Link>
        </div>
      </footer>
    </div>
  );
}
