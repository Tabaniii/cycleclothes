import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-brand-light-green px-2.5 py-0.5 text-xs font-semibold text-brand-green',
        className,
      )}
      {...props}
    />
  );
}
