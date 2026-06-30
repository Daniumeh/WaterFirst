import type { HydrationCheckpoint, HydrationLog } from './types';

const minutesPerDay = 24 * 60;

export function getDeviceNow() {
  return new Date();
}

export function getDeviceTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function getLocalDateKey(date = getDeviceNow()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function getLocalMinutes(date = getDeviceNow()) {
  return date.getHours() * 60 + date.getMinutes();
}

export function isSameLocalDate(left: Date, right = getDeviceNow()) {
  return getLocalDateKey(left) === getLocalDateKey(right);
}

export function getLocalDayStart(date = getDeviceNow()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getAccurateLogTimestamp(date = getDeviceNow()) {
  return date.toISOString();
}

export function formatLocalTime(isoTimestamp: string) {
  return new Date(isoTimestamp).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatLocalDateLabel(dateKey: string) {
  const [yearValue, monthValue, dayValue] = dateKey.split('-').map(Number);
  const year = Number.isFinite(yearValue) ? yearValue : 0;
  const month = Number.isFinite(monthValue) ? monthValue : 1;
  const day = Number.isFinite(dayValue) ? dayValue : 1;

  return new Date(year, month - 1, day).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function filterLogsForLocalDate(logs: HydrationLog[], date = getDeviceNow()) {
  const dateKey = getLocalDateKey(date);

  return logs.filter((log) => getLocalDateKey(new Date(log.loggedAt)) === dateKey);
}

export function sumLogsForLocalDate(logs: HydrationLog[], date = getDeviceNow()) {
  return filterLogsForLocalDate(logs, date).reduce((total, log) => total + log.amountMl, 0);
}

export function getCompletedDrinkCountForLocalDate(logs: HydrationLog[], date = getDeviceNow()) {
  return filterLogsForLocalDate(logs, date).length;
}

export function getCheckpointStatus(
  checkpoint: HydrationCheckpoint,
  consumedMl: number,
  now = getDeviceNow(),
) {
  if (consumedMl >= checkpoint.targetMl) {
    return 'Completed' as const;
  }

  if (checkpoint.dueMinutes < getLocalMinutes(now)) {
    return 'Missed' as const;
  }

  return 'Upcoming' as const;
}

export function getActionCheckpoint(
  checkpoints: HydrationCheckpoint[],
  consumedMl: number,
  now = getDeviceNow(),
) {
  const currentMinutes = getLocalMinutes(now);
  const missed = checkpoints.find(
    (checkpoint) => checkpoint.dueMinutes < currentMinutes && consumedMl < checkpoint.targetMl,
  );

  if (missed) {
    return missed;
  }

  return checkpoints.find((checkpoint) => checkpoint.targetMl > consumedMl) ?? null;
}

export function calculateComplianceScore(
  checkpoints: HydrationCheckpoint[],
  consumedMl: number,
  now = getDeviceNow(),
) {
  const dueCheckpoints = checkpoints.filter((checkpoint) => checkpoint.dueMinutes <= getLocalMinutes(now));

  if (dueCheckpoints.length === 0) {
    return 100;
  }

  const completed = dueCheckpoints.filter((checkpoint) => consumedMl >= checkpoint.targetMl).length;

  return Math.max(20, Math.round((completed / dueCheckpoints.length) * 100));
}

export function calculateExpectedMlByNow(
  checkpoints: HydrationCheckpoint[],
  targetMl: number,
  now = getDeviceNow(),
) {
  if (checkpoints.length === 0) {
    return 0;
  }

  const currentMinutes = getLocalMinutes(now);
  const sorted = [...checkpoints].sort((left, right) => left.dueMinutes - right.dueMinutes);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  if (currentMinutes <= first.dueMinutes) {
    return Math.round((first.targetMl * currentMinutes) / Math.max(first.dueMinutes, 1));
  }

  let previousCheckpoint = first;

  for (const checkpoint of sorted) {
    if (checkpoint.dueMinutes <= currentMinutes) {
      previousCheckpoint = checkpoint;
    }
  }

  const nextCheckpoint = sorted.find((checkpoint) => checkpoint.dueMinutes > currentMinutes);

  if (!nextCheckpoint || currentMinutes >= last.dueMinutes) {
    return targetMl;
  }

  const segmentMinutes = Math.max(nextCheckpoint.dueMinutes - previousCheckpoint.dueMinutes, 1);
  const elapsedSegmentMinutes = currentMinutes - previousCheckpoint.dueMinutes;
  const segmentTarget = nextCheckpoint.targetMl - previousCheckpoint.targetMl;

  return Math.round(
    previousCheckpoint.targetMl + (segmentTarget * elapsedSegmentMinutes) / segmentMinutes,
  );
}

export function calculateLocalStreak(logs: HydrationLog[], targetMl: number, now = getDeviceNow()) {
  let streak = 0;
  const cursor = getLocalDayStart(now);

  for (let dayOffset = 0; dayOffset < 365; dayOffset += 1) {
    const loggedMl = sumLogsForLocalDate(logs, cursor);

    if (loggedMl < targetMl) {
      if (dayOffset === 0) {
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }

      break;
    }

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function minutesUntilLocalMidnight(now = getDeviceNow()) {
  const nextMidnight = getLocalDayStart(now);
  nextMidnight.setDate(nextMidnight.getDate() + 1);

  return Math.max(0, Math.ceil((nextMidnight.getTime() - now.getTime()) / 60000));
}

export function addLocalMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60000);
}

export function normalizeLocalMinutes(minutes: number) {
  return ((minutes % minutesPerDay) + minutesPerDay) % minutesPerDay;
}
