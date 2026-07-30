import { create } from 'zustand';

import { addLocalMinutes, getDeviceNow, getLocalDateKey } from '@/src/features/hydration/deviceTime';

const dailySkipLimit = 2;
const emergencySkipMinutes = 15;

type ActiveSoftShield = {
  activatedAt: string;
  checkpointId: string;
  dueTimeLabel: string;
  requiredAmountMl: number;
};

type AccountabilityStore = {
  activeShield: ActiveSoftShield | null;
  dailySkipCount: number;
  dailySkipLimit: number;
  overrideCount: number;
  selectedApplicationCount: number;
  skipDateKey: string;
  snoozedUntil: string | null;
  activateShield: (shield: ActiveSoftShield) => void;
  releaseShield: () => void;
  recordOverride: () => void;
  setSelectedApplicationCount: (selectedApplicationCount: number) => void;
  skipForNow: () => boolean;
  snoozeUntil: (snoozedUntil: string) => void;
};

export const useAccountabilityStore = create<AccountabilityStore>((set) => ({
  activeShield: null,
  dailySkipCount: 0,
  dailySkipLimit,
  overrideCount: 0,
  selectedApplicationCount: 0,
  skipDateKey: getLocalDateKey(),
  snoozedUntil: null,
  activateShield: (shield) =>
    set((state) => {
      if (state.activeShield?.checkpointId === shield.checkpointId) {
        return state;
      }

      return { activeShield: shield };
    }),
  releaseShield: () => set({ activeShield: null, snoozedUntil: null }),
  recordOverride: () =>
    set((state) => ({
      overrideCount: state.overrideCount + 1,
      activeShield: null,
      snoozedUntil: null,
    })),
  setSelectedApplicationCount: (selectedApplicationCount) =>
    set({ selectedApplicationCount: Math.max(0, Math.round(selectedApplicationCount)) }),
  skipForNow: () => {
    const now = getDeviceNow();
    const todayKey = getLocalDateKey(now);
    let didSkip = false;

    set((state) => {
      const dailySkipCount = state.skipDateKey === todayKey ? state.dailySkipCount : 0;

      if (dailySkipCount >= state.dailySkipLimit) {
        return {
          dailySkipCount,
          skipDateKey: todayKey,
        };
      }

      didSkip = true;

      return {
        activeShield: null,
        dailySkipCount: dailySkipCount + 1,
        skipDateKey: todayKey,
        snoozedUntil: addLocalMinutes(now, emergencySkipMinutes).toISOString(),
      };
    });

    return didSkip;
  },
  snoozeUntil: (snoozedUntil) => set({ snoozedUntil }),
}));
