import type { HydrationCheckpoint } from '../hydration/types';
import { getLocalMinutes } from '../hydration/deviceTime';

type SoftLockInput = {
  checkpoints: HydrationCheckpoint[];
  loggedMl: number;
  now: Date;
  selectedApplicationCount?: number;
  softLockEnabled?: boolean;
  snoozedUntil: string | null;
  overrideCount: number;
};

export function getDueSoftLockCheckpoint(input: SoftLockInput) {
  if (input.softLockEnabled === false) {
    return null;
  }

  if (input.selectedApplicationCount !== undefined && input.selectedApplicationCount <= 0) {
    return null;
  }

  if (input.snoozedUntil && new Date(input.snoozedUntil).getTime() > input.now.getTime()) {
    return null;
  }

  if (input.overrideCount >= 3) {
    return null;
  }

  const currentMinutes = getLocalMinutes(input.now);

  return (
    input.checkpoints.find(
      (checkpoint) => checkpoint.dueMinutes <= currentMinutes && input.loggedMl < checkpoint.targetMl,
    ) ?? null
  );
}

export function shouldTriggerSoftLock(input: SoftLockInput) {
  return Boolean(getDueSoftLockCheckpoint(input));
}

export function getRequiredLogAmountMl(checkpoint: HydrationCheckpoint, loggedMl: number) {
  return Math.max(checkpoint.targetMl - loggedMl, 0);
}
