import * as Notifications from 'expo-notifications';

import type { HydrationCheckpoint } from '../hydration/types';

type ReminderScheduleInput = {
  enabled: boolean;
  checkpoints: HydrationCheckpoint[];
};

export async function requestReminderPermissions() {
  const existing = await Notifications.getPermissionsAsync();

  if (existing.granted) {
    return existing;
  }

  return Notifications.requestPermissionsAsync();
}

export async function scheduleCheckpointReminders(input: ReminderScheduleInput) {
  if (!input.enabled) {
    return [];
  }

  return input.checkpoints.map((checkpoint) => ({
    checkpointId: checkpoint.id,
    timeLabel: checkpoint.timeLabel,
    title: 'HydraLock checkpoint',
    body: `Aim for ${checkpoint.targetMl} ml by ${checkpoint.timeLabel}.`,
  }));
}
