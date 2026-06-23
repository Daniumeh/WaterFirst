import { shouldTriggerSoftLock } from '@/src/features/accountability/softLockRules';
import { generateCheckpoints } from '@/src/features/hydration/hydrationMath';

describe('soft lock rules', () => {
  const checkpoints = generateCheckpoints(3000, '08:00', '20:00');

  it('triggers when the user is behind a missed checkpoint', () => {
    expect(
      shouldTriggerSoftLock({
        checkpoints,
        loggedMl: 200,
        now: new Date('2026-06-23T12:00:00'),
        snoozedUntil: null,
        overrideCount: 0,
      }),
    ).toBe(true);
  });

  it('does not trigger while snoozed', () => {
    expect(
      shouldTriggerSoftLock({
        checkpoints,
        loggedMl: 200,
        now: new Date('2026-06-23T12:00:00'),
        snoozedUntil: '2026-06-23T12:15:00',
        overrideCount: 0,
      }),
    ).toBe(false);
  });
});
