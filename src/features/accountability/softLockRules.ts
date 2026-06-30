import type { HydrationCheckpoint } from '../hydration/types';
import { getLocalMinutes } from '../hydration/deviceTime';

type SoftLockInput = {
  checkpoints: HydrationCheckpoint[];
  loggedMl: number;
  now: Date;
  snoozedUntil: string | null;
  overrideCount: number;
};

export function shouldTriggerSoftLock(input: SoftLockInput) {
  if (input.snoozedUntil && new Date(input.snoozedUntil).getTime() > input.now.getTime()) {
    return false;
  }

  if (input.overrideCount >= 3) {
    return false;
  }

  const currentMinutes = getLocalMinutes(input.now);
  const missedCheckpoint = input.checkpoints.find(
    (checkpoint) => checkpoint.dueMinutes < currentMinutes && input.loggedMl < checkpoint.targetMl,
  );

  return Boolean(missedCheckpoint);
}
