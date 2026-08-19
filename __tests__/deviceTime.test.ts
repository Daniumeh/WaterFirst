import {
  calculateExpectedMlByNow,
  filterLogsForLocalDate,
  getLocalDateKey,
  getNextEnforceableCheckpoint,
  getNextUpcomingCheckpoint,
  sumLogsForLocalDate,
} from '@/src/features/hydration/deviceTime';
import { generateCheckpoints } from '@/src/features/hydration/hydrationMath';
import type { HydrationLog } from '@/src/features/hydration/types';

describe('device local hydration time', () => {
  it('formats local date keys from the device Date object', () => {
    expect(getLocalDateKey(new Date(2026, 5, 30, 0, 5))).toBe('2026-06-30');
  });

  it('groups logs by the user local date instead of UTC date slices', () => {
    const logs: HydrationLog[] = [
      {
        id: 'late-night-local',
        amountMl: 500,
        loggedAt: new Date(2026, 5, 30, 23, 55).toISOString(),
      },
      {
        id: 'next-day-local',
        amountMl: 250,
        loggedAt: new Date(2026, 6, 1, 0, 5).toISOString(),
      },
    ];

    const june30Logs = filterLogsForLocalDate(logs, new Date(2026, 5, 30, 12, 0));

    expect(june30Logs).toHaveLength(1);
    expect(june30Logs[0].id).toBe('late-night-local');
    expect(sumLogsForLocalDate(logs, new Date(2026, 6, 1, 12, 0))).toBe(250);
  });

  it('calculates schedule pace from the device local current time', () => {
    const checkpoints = generateCheckpoints(3000, '08:00', '20:00');

    expect(calculateExpectedMlByNow(checkpoints, 3000, new Date(2026, 5, 30, 14, 0))).toBe(1810);
  });

  it('finds the next upcoming checkpoint even when earlier checkpoints were missed', () => {
    const checkpoints = generateCheckpoints(2850, '07:00', '22:30');

    expect(getNextUpcomingCheckpoint(checkpoints, new Date(2026, 5, 30, 18, 51))?.timeLabel).toBe(
      '21:30',
    );
  });

  it('wraps next upcoming checkpoint to the first scheduled time after the final checkpoint', () => {
    const checkpoints = generateCheckpoints(2850, '07:00', '22:30');

    expect(getNextUpcomingCheckpoint(checkpoints, new Date(2026, 5, 30, 23, 0))?.timeLabel).toBe(
      '07:30',
    );
  });

  it('skips an upcoming checkpoint when early water logging already satisfies it', () => {
    const checkpoints = [
      { id: 'checkpoint-1', dueMinutes: 8 * 60, targetMl: 500, timeLabel: '08:00' },
      { id: 'checkpoint-2', dueMinutes: 10 * 60, targetMl: 1000, timeLabel: '10:00' },
      { id: 'checkpoint-3', dueMinutes: 12 * 60, targetMl: 1500, timeLabel: '12:00' },
    ];

    expect(
      getNextEnforceableCheckpoint(checkpoints, 1000, new Date(2026, 5, 30, 9, 40))?.timeLabel,
    ).toBe('12:00');
  });

  it('keeps an overdue unsatisfied checkpoint as the next enforceable checkpoint', () => {
    const checkpoints = [
      { id: 'checkpoint-1', dueMinutes: 8 * 60, targetMl: 500, timeLabel: '08:00' },
      { id: 'checkpoint-2', dueMinutes: 10 * 60, targetMl: 1000, timeLabel: '10:00' },
      { id: 'checkpoint-3', dueMinutes: 12 * 60, targetMl: 1500, timeLabel: '12:00' },
    ];

    expect(
      getNextEnforceableCheckpoint(checkpoints, 750, new Date(2026, 5, 30, 10, 5))?.timeLabel,
    ).toBe('10:00');
  });
});
