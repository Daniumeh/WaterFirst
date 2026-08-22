import * as Notifications from 'expo-notifications';

import {
  buildReminderRequests,
  cancelReminderNotifications,
} from '@/src/features/reminders/reminderService';
import type { HydrationCheckpoint } from '@/src/features/hydration/types';

const mockedNotifications = Notifications as jest.Mocked<typeof Notifications>;

describe('hydration reminder scheduling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedNotifications.getAllScheduledNotificationsAsync.mockResolvedValue([]);
  });

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

  it('creates a 15 minute reminder before the next water schedule', () => {
    const morning: HydrationCheckpoint = {
      dueMinutes: 9 * 60,
      id: 'morning',
      targetMl: 500,
      timeLabel: '09:00',
    };
    const next: HydrationCheckpoint = {
      dueMinutes: 10 * 60,
      id: 'next',
      targetMl: 1000,
      timeLabel: '10:00',
    };
    const afternoon: HydrationCheckpoint = {
      dueMinutes: 14 * 60,
      id: 'afternoon',
      targetMl: 1500,
      timeLabel: '14:00',
    };

    const requests = buildReminderRequests(
      [morning, next, afternoon],
      new Date(2026, 5, 30, 9, 40),
    );
    const nextFifteenMinuteReminder = requests.find(
      (request) => request.checkpoint.id === 'next' && request.offsetMinutes === 15,
    );

    expect(nextFifteenMinuteReminder).toMatchObject({
      checkpoint: next,
      hour: 9,
      minute: 45,
      offsetMinutes: 15,
    });
    expect(nextFifteenMinuteReminder?.nextFireDate.getDate()).toBe(30);
  });

  it('cancels stored and discovered WaterFirst reminder notifications', async () => {
    mockedNotifications.getAllScheduledNotificationsAsync.mockResolvedValue([
      {
        content: {
          data: {
            checkpointId: 'morning',
            dueMinutes: 9 * 60,
            offsetMinutes: 15,
          },
          title: 'WaterFirst',
        },
        identifier: 'legacy-reminder-id',
      },
      {
        content: {
          data: {
            reminderSource: 'waterfirst-hydration',
          },
          title: 'WaterFirst',
        },
        identifier: 'tagged-reminder-id',
      },
      {
        content: {
          data: {},
          title: 'Other app reminder',
        },
        identifier: 'other-reminder-id',
      },
    ] as Awaited<ReturnType<typeof Notifications.getAllScheduledNotificationsAsync>>);

    await cancelReminderNotifications(['stored-reminder-id', 'legacy-reminder-id']);

    expect(mockedNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(3);
    expect(mockedNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      'stored-reminder-id',
    );
    expect(mockedNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      'legacy-reminder-id',
    );
    expect(mockedNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      'tagged-reminder-id',
    );
    expect(mockedNotifications.cancelScheduledNotificationAsync).not.toHaveBeenCalledWith(
      'other-reminder-id',
    );
  });
});
