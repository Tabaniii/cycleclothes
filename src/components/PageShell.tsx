import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import type { ReactNode } from 'react';

export function PageShell({ children, className = 'bg-white' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex min-h-dvh flex-col font-sans ${className}`}>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
