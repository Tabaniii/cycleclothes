import { cn } from '@/lib/utils';
import { badgeTone } from '@/lib/badges';
import type { BadgeStatus } from '@/types/database';

const TONE_CLASS: Record<string, string> = {
  gold: 'bg-[#E4C36A] text-brand-green border-[#C9A227]',
  silver: 'bg-[#D9D9D4] text-brand-green border-[#A8A8A0]',
  bronze: 'bg-[#E0C4A8] text-brand-green border-[#B5835A]',
  newbie: 'bg-brand-cream text-brand-green border-brand-green/15',
};

export function UserBadgePill({
  status,
  className,
  compact = false,
}: {
  status: BadgeStatus | string | null | undefined;
  className?: string;
  compact?: boolean;
}) {
  const label = status || 'Newbie';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-semibold',
        compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
        TONE_CLASS[badgeTone(label)],
        className,
      )}
      title={`Badge donasi: ${label}`}
    >
      {label}
    </span>
  );
}
