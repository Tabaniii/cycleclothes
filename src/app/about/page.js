import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ContactSection from '@/components/ContactSection';
import TeamGallery from '@/components/TeamGallery';

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

export default function AboutPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-white font-sans">
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

        <section className="bg-brand-cream-light overflow-hidden">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 pt-14 sm:pt-16">
            <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-brand-blue">
                Our Team
              </h2>
              <p className="mt-3 text-gray-700 leading-relaxed">
                One team, one goal: making clothes cycle back to the right people.
              </p>
            </div>
          </div>
          <TeamGallery />
        </section>
        <ContactSection />
      </main>

      <Footer />
    </div>
  );
}
