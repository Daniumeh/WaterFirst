import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  getDeviceNow,
  getDeviceTimeZone,
  normalizeLocalMinutes,
} from '@/src/features/hydration/deviceTime';
import type { HydrationCheckpoint } from '@/src/features/hydration/types';

type ReminderScheduleInput = {
  checkpoints: HydrationCheckpoint[];
  enabled: boolean;
  existingNotificationIds?: string[];
  now?: Date;
};

export type ScheduledReminder = {
  checkpointId: string;
  notificationId: string;
  offsetMinutes: number;
  nextFireDate: Date;
  timeLabel: string;
};

const notificationChannelId = 'hydration-checkpoints';
const reminderSource = 'waterfirst-hydration';

const reminderMessages: Record<number, string> = {
  15: 'Next water schedule in 15 minutes. Get ready to drink some water.',
  5: 'Almost time to hydrate. Your kidneys will thank you.',
  0: 'Time to drink water. Log your intake now.',
};

export function configureNotificationPresentation() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function requestReminderPermissions() {
  if (Platform.OS === 'web') {
    return {
      granted: false,
      status: 'unsupported',
    };
  }

  await ensureNotificationChannel();

  const existing = await Notifications.getPermissionsAsync();

  if (existing.granted) {
    return existing;
  }

  return Notifications.requestPermissionsAsync();
}

export async function cancelReminderNotifications(notificationIds: string[]) {
  if (Platform.OS === 'web') {
    return;
  }

  const scheduledReminders = await getScheduledHydrationReminderIds();
  const identifiers = new Set([...notificationIds, ...scheduledReminders]);

  await Promise.all(
    [...identifiers].map((identifier) =>
      Notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined),
    ),
  );
}

export async function scheduleCheckpointReminders(input: ReminderScheduleInput) {
  await cancelReminderNotifications(input.existingNotificationIds ?? []);

  if (!input.enabled) {
    return [];
  }

  const permission = await requestReminderPermissions();

  if (!permission.granted) {
    throw new Error(
      'Hydration reminders need notification access. You can enable notifications in your device settings and try again.',
    );
  }

  await ensureNotificationChannel();

  const requests = buildReminderRequests(input.checkpoints, input.now ?? getDeviceNow());
  const scheduled: ScheduledReminder[] = [];

  for (const request of requests) {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        body: reminderMessages[request.offsetMinutes],
        data: {
          checkpointId: request.checkpoint.id,
          dueMinutes: request.checkpoint.dueMinutes,
          offsetMinutes: request.offsetMinutes,
          reminderSource,
          timeZone: getDeviceTimeZone(),
        },
        sound: true,
        title: 'WaterFirst',
      },
      trigger: {
        channelId: notificationChannelId,
        hour: request.hour,
        minute: request.minute,
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
      },
    });

    scheduled.push({
      checkpointId: request.checkpoint.id,
      notificationId,
      nextFireDate: request.nextFireDate,
      offsetMinutes: request.offsetMinutes,
      timeLabel: request.checkpoint.timeLabel,
    });
  }

  return scheduled;
}

export function buildReminderRequests(checkpoints: HydrationCheckpoint[], now = getDeviceNow()) {
  return checkpoints.flatMap((checkpoint) =>
    [15, 5, 0]
      .map((offsetMinutes) => ({
        checkpoint,
        ...getLocalTriggerTime(checkpoint.dueMinutes, offsetMinutes, now),
        offsetMinutes,
      }))
  );
}

async function getScheduledHydrationReminderIds() {
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);

  return scheduledNotifications
    .filter(isHydrationReminderRequest)
    .map((notification) => notification.identifier);
}

function isHydrationReminderRequest(notification: Notifications.NotificationRequest) {
  const data = notification.content.data as Record<string, unknown> | undefined;

  if (data?.reminderSource === reminderSource) {
    return true;
  }

  return (
    notification.content.title === 'WaterFirst' &&
    typeof data?.checkpointId === 'string' &&
    typeof data?.dueMinutes === 'number' &&
    typeof data?.offsetMinutes === 'number'
  );
}

function getLocalTriggerTime(dueMinutes: number, offsetMinutes: number, now: Date) {
  const localMinutes = normalizeLocalMinutes(dueMinutes - offsetMinutes);
  const hour = Math.floor(localMinutes / 60);
  const minute = localMinutes % 60;
  const nextFireDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  nextFireDate.setHours(hour, minute, 0, 0);

  if (nextFireDate.getTime() <= now.getTime()) {
    nextFireDate.setDate(nextFireDate.getDate() + 1);
  }

  return {
    hour,
    minute,
    nextFireDate,
  };
}

async function ensureNotificationChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(notificationChannelId, {
    importance: Notifications.AndroidImportance.HIGH,
    name: 'Hydration checkpoints',
    vibrationPattern: [0, 250, 250, 250],
  });
}
