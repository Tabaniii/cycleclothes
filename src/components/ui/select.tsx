import type { SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-11 w-full rounded-lg border border-brand-green/20 bg-white px-3 text-sm text-brand-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-light-green',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
