import { buildReminderRequests } from '@/src/features/reminders/reminderService';
import type { HydrationCheckpoint } from '@/src/features/hydration/types';

describe('hydration reminder scheduling', () => {
  const checkpoint: HydrationCheckpoint = {
    dueMinutes: 12 * 60,
    id: 'midday',
    targetMl: 1000,
    timeLabel: '12:00',
  };

  it('creates 15 minute, 5 minute, and exact-time reminders for future checkpoints', () => {
    const requests = buildReminderRequests([checkpoint], new Date(2026, 5, 30, 11, 40));

    expect(requests.map((request) => request.offsetMinutes)).toEqual([15, 5, 0]);
    expect(requests.map((request) => request.minute)).toEqual([45, 55, 0]);
    expect(requests.map((request) => request.nextFireDate.getDate())).toEqual([30, 30, 30]);
  });

  it('rolls times that have already passed today to the next local day', () => {
    const requests = buildReminderRequests([checkpoint], new Date(2026, 5, 30, 11, 50));

    expect(requests.map((request) => request.offsetMinutes)).toEqual([15, 5, 0]);
    expect(requests.map((request) => request.nextFireDate.getDate())).toEqual([1, 30, 30]);
  });
});
