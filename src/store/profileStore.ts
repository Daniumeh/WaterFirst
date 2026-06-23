import { create } from 'zustand';

import type { HydrationProfile } from '@/src/features/hydration/types';

const defaultProfile: HydrationProfile = {
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
  onboardingComplete: false,
};

type ProfileStore = {
  profile: HydrationProfile;
  completeOnboarding: (profile: HydrationProfile) => void;
  resetOnboarding: () => void;
  updateProfile: (profile: Partial<HydrationProfile>) => void;
};

export const useProfileStore = create<ProfileStore>((set) => ({
  profile: defaultProfile,
  completeOnboarding: (profile) => set({ profile }),
  resetOnboarding: () =>
    set((state) => ({
      profile: { ...state.profile, onboardingComplete: false },
    })),
  updateProfile: (profile) =>
    set((state) => ({
      profile: { ...state.profile, ...profile },
    })),
}));
