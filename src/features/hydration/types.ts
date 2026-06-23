export type UnitPreference = 'imperial' | 'metric';
export type ActivityLevel = 'light' | 'moderate' | 'high';
export type Climate = 'cool' | 'temperate' | 'hot';

export type HydrationProfile = {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  weight: number;
  activityLevel: ActivityLevel;
  activityDescription: string;
  climate: Climate;
  wakeTime: string;
  sleepTime: string;
  unitPreference: UnitPreference;
  notificationConsent: boolean;
  softLockConsent: boolean;
  onboardingComplete: boolean;
};

export type HydrationGoal = {
  targetMl: number;
  manualOverrideMl: number | null;
  unitPreference: UnitPreference;
};

export type HydrationLog = {
  id: string;
  amountMl: number;
  loggedAt: string;
};

export type HydrationCheckpoint = {
  id: string;
  timeLabel: string;
  dueMinutes: number;
  targetMl: number;
};

export type HydrationProgress = {
  loggedMl: number;
  remainingMl: number;
  percentComplete: number;
};
