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
        selectedApplicationCount: 1,
        softLockEnabled: true,
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
        selectedApplicationCount: 1,
        softLockEnabled: true,
        snoozedUntil: '2026-06-23T12:15:00',
        overrideCount: 0,
      }),
    ).toBe(false);
  });

  it('does not trigger without selected distracting apps', () => {
    expect(
      shouldTriggerSoftLock({
        checkpoints,
        loggedMl: 200,
        now: new Date('2026-06-23T12:00:00'),
        selectedApplicationCount: 0,
        softLockEnabled: true,
        snoozedUntil: null,
        overrideCount: 0,
      }),
    ).toBe(false);
  });
});
