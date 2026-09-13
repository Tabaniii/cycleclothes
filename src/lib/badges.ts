import type { BadgeStatus } from '@/types/database';

export function nextBadgeProgress(donationCount: number) {
  if (donationCount >= 10) {
    return {
      current: 'Penghuni Surga' as BadgeStatus,
      next: null as BadgeStatus | null,
      remaining: 0,
      target: 10,
      progress: 1,
    };
  }
  if (donationCount >= 5) {
    return {
      current: 'Anak Tuhan' as BadgeStatus,
      next: 'Penghuni Surga' as BadgeStatus,
      remaining: 10 - donationCount,
      target: 10,
      progress: donationCount / 10,
    };
  }
  if (donationCount >= 1) {
    return {
      current: 'Orang Baik' as BadgeStatus,
      next: 'Anak Tuhan' as BadgeStatus,
      remaining: 5 - donationCount,
      target: 5,
      progress: donationCount / 5,
    };
  }
  return {
    current: 'Newbie' as BadgeStatus,
    next: 'Orang Baik' as BadgeStatus,
    remaining: 1 - donationCount,
    target: 1,
    progress: 0,
  };
}

export function badgeTone(status: BadgeStatus | string | null | undefined) {
  switch (status) {
    case 'Penghuni Surga':
      return 'gold';
    case 'Anak Tuhan':
      return 'silver';
    case 'Orang Baik':
      return 'bronze';
    default:
      return 'newbie';
  }
}
