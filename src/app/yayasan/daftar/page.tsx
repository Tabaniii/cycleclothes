import { PageShell } from '@/components/PageShell';
import { FoundationVerificationForm } from '@/components/FoundationVerificationForm';

export default function FoundationApplyPage() {
  return (
    <PageShell className="bg-brand-cream">
      <div className="mx-auto max-w-xl px-6 py-10">
        <h1 className="mb-2 text-2xl font-bold text-brand-green">Daftar sebagai yayasan</h1>
        <p className="mb-6 text-sm text-brand-green/80">
          Upload dokumen legal. Admin akan meninjau sebelum kamu bisa membuat wishlist donasi.
        </p>
        <div className="rounded-2xl bg-white p-6">
          <FoundationVerificationForm />
        </div>
      </div>
    </PageShell>
  );
}
