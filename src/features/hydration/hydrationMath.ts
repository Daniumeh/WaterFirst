import type {
  ActivityLevel,
  Climate,
  HydrationCheckpoint,
  HydrationProgress,
  UnitPreference,
} from './types';

const ML_PER_OUNCE = 29.5735;
const KG_PER_POUND = 0.453592;

const activityAdjustments: Record<ActivityLevel, number> = {
  light: 0,
  moderate: 350,
  high: 700,
};

const climateAdjustments: Record<Climate, number> = {
  cool: 0,
  temperate: 150,
  hot: 350,
};

type GoalInput = {
  weight: number;
  unitPreference: UnitPreference;
  activityLevel: ActivityLevel;
  climate: Climate;
};

export function calculateDailyGoalMl(input: GoalInput) {
  const weightKg = input.unitPreference === 'imperial' ? input.weight * KG_PER_POUND : input.weight;
  const baselineMl = weightKg * 35;
  const adjustedMl =
    baselineMl + activityAdjustments[input.activityLevel] + climateAdjustments[input.climate];

  return roundToNearest(adjustedMl, 50);
}

export function calculateProgress(loggedMl: number, targetMl: number): HydrationProgress {
  const safeTarget = Math.max(targetMl, 1);
  const percentComplete = Math.min(100, Math.round((loggedMl / safeTarget) * 100));

  return {
    loggedMl,
    remainingMl: Math.max(targetMl - loggedMl, 0),
    percentComplete,
  };
}

export function generateCheckpoints(
  targetMl: number,
  wakeTime: string,
  sleepTime: string,
  checkpointCount = 4,
): HydrationCheckpoint[] {
  const wakeMinutes = parseTimeToMinutes(wakeTime);
  const sleepMinutes = parseTimeToMinutes(sleepTime);
  const activeMinutes =
    sleepMinutes > wakeMinutes ? sleepMinutes - wakeMinutes : 24 * 60 - wakeMinutes + sleepMinutes;
  const interval = activeMinutes / checkpointCount;

  return Array.from({ length: checkpointCount }, (_, index) => {
    const dueMinutes = normalizeMinutes(Math.round(wakeMinutes + interval * (index + 1)));
    const targetForCheckpoint = Math.round((targetMl / checkpointCount) * (index + 1));

    return {
      id: `checkpoint-${index + 1}`,
      dueMinutes,
      targetMl: roundToNearest(targetForCheckpoint, 25),
      timeLabel: formatMinutes(dueMinutes),
    };
  });
}

export function getNextCheckpoint(checkpoints: HydrationCheckpoint[], now: Date) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return checkpoints.find((checkpoint) => checkpoint.dueMinutes >= currentMinutes) ?? null;
}

export function mlToPreferredUnit(amountMl: number, unitPreference: UnitPreference) {
  if (unitPreference === 'metric') {
    return { amount: amountMl, label: 'ml' };
  }

  return { amount: Math.round(amountMl / ML_PER_OUNCE), label: 'oz' };
}

function parseTimeToMinutes(time: string) {
  const [hours = '0', minutes = '0'] = time.split(':');
  const parsedHours = Number(hours);
  const parsedMinutes = Number(minutes);

  if (Number.isNaN(parsedHours) || Number.isNaN(parsedMinutes)) {
    return 8 * 60;
  }

  return normalizeMinutes(parsedHours * 60 + parsedMinutes);
}

function formatMinutes(totalMinutes: number) {
  const normalized = normalizeMinutes(totalMinutes);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function normalizeMinutes(minutes: number) {
  return ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
}

function roundToNearest(value: number, increment: number) {
  return Math.round(value / increment) * increment;
}
