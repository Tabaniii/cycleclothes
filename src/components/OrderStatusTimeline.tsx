import type { OrderStatus } from '@/types/database';
import { cn } from '@/lib/utils';

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'pending', label: 'Menunggu bayar' },
  { key: 'paid', label: 'Dibayar (escrow)' },
  { key: 'shipped', label: 'Dikirim' },
  { key: 'completed', label: 'Selesai' },
];

const TERMINAL: Partial<Record<OrderStatus, string>> = {
  disputed: 'Sengketa',
  refunded: 'Dana dikembalikan',
};

export function OrderStatusTimeline({ status }: { status: OrderStatus }) {
  if (status === 'disputed' || status === 'refunded') {
    return (
      <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
        {TERMINAL[status]}
      </p>
    );
  }

  const currentIndex = STEPS.findIndex((step) => step.key === status);

  return (
    <ol className="grid grid-cols-4 gap-2">
      {STEPS.map((step, index) => {
        const active = index <= currentIndex;
        return (
          <li key={step.key} className="text-center">
            <div
              className={cn(
                'mx-auto mb-1 h-2 rounded-full',
                active ? 'bg-brand-light-green' : 'bg-brand-green/15',
              )}
            />
            <p className={cn('text-[11px]', active ? 'font-semibold text-brand-green' : 'text-brand-green/50')}>
              {step.label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
