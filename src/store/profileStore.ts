import { create } from 'zustand';

import type {
  HydrationCheckpoint,
  HydrationGoal,
  HydrationProfile,
} from '@/src/features/hydration/types';

export const defaultProfile: HydrationProfile = {
  name: '',
  firstName: '',
  lastName: '',
  email: '',
  weight: 180,
  activityLevel: 'moderate',
  activityDescription: '',
  climate: 'temperate',
  wakeTime: '07:00',
  sleepTime: '22:30',
  unitPreference: 'imperial',
  notificationConsent: false,
  softLockConsent: false,
  softLockSelectedApplicationCount: 0,
  onboardingComplete: false,
};

type ProfileStore = {
  pendingOnboardingPlan: PendingOnboardingPlan | null;
  profile: HydrationProfile;
  completeOnboarding: (profile: HydrationProfile) => void;
  clearPendingOnboardingPlan: () => void;
  resetOnboarding: () => void;
  setPendingOnboardingPlan: (plan: PendingOnboardingPlan) => void;
  updateProfile: (profile: Partial<HydrationProfile>) => void;
};

export type PendingOnboardingPlan = {
  appPackageNames: string[];
  checkpoints: HydrationCheckpoint[];
  firstLogMl: number;
  goal: HydrationGoal;
  profile: HydrationProfile;
  selectedAppIds: string[];
};

export const useProfileStore = create<ProfileStore>((set) => ({
  pendingOnboardingPlan: null,
  profile: defaultProfile,
  clearPendingOnboardingPlan: () => set({ pendingOnboardingPlan: null }),
  completeOnboarding: (profile) => set({ pendingOnboardingPlan: null, profile }),
  resetOnboarding: () =>
    set((state) => ({
      pendingOnboardingPlan: null,
      profile: { ...state.profile, onboardingComplete: false },
    })),
  setPendingOnboardingPlan: (plan) => set({ pendingOnboardingPlan: plan }),
  updateProfile: (profile) =>
    set((state) => ({
      profile: { ...state.profile, ...profile },
    })),
}));
