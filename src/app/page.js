import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-dvh flex flex-col bg-white font-sans">
      <Navbar />
      <main className="hidden md:block flex-1 w-full">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-12">
        </div>
      </main>
      <Footer />
    </div>
  );
}
