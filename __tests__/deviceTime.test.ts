import {
  calculateExpectedMlByNow,
  filterLogsForLocalDate,
  getLocalDateKey,
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

    expect(calculateExpectedMlByNow(checkpoints, 3000, new Date(2026, 5, 30, 14, 0))).toBe(1500);
  });
});
