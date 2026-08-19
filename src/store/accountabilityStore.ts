import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { addLocalMinutes, getDeviceNow, getLocalDateKey } from '@/src/features/hydration/deviceTime';

const dailySkipLimit = 2;
const emergencySkipMinutes = 15;

export type HydrationShieldPermissionStatus = 'disabled' | 'enabled' | 'revoked';

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
  permissionStatus: HydrationShieldPermissionStatus;
  protectedAppIds: string[];
  protectedAppPackageNames: string[];
  selectedApplicationCount: number;
  skipDateKey: string;
  snoozedUntil: string | null;
  activateShield: (shield: ActiveSoftShield) => void;
  releaseShield: () => void;
  recordOverride: () => void;
  setHydrationShieldPermissionStatus: (permissionStatus: HydrationShieldPermissionStatus) => void;
  setProtectedApps: (appIds: string[], packageNames: string[]) => void;
  setSelectedApplicationCount: (selectedApplicationCount: number) => void;
  skipForNow: () => boolean;
  snoozeUntil: (snoozedUntil: string) => void;
};

export const useAccountabilityStore = create<AccountabilityStore>()(
  persist(
    (set) => ({
      activeShield: null,
      dailySkipCount: 0,
      dailySkipLimit,
      overrideCount: 0,
      permissionStatus: 'disabled',
      protectedAppIds: [],
      protectedAppPackageNames: [],
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
      setHydrationShieldPermissionStatus: (permissionStatus) => set({ permissionStatus }),
      setProtectedApps: (protectedAppIds, protectedAppPackageNames) =>
        set({
          protectedAppIds,
          protectedAppPackageNames,
          selectedApplicationCount: protectedAppIds.length,
        }),
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
    }),
    {
      name: 'waterfirst-hydration-shield',
      partialize: (state) => ({
        dailySkipCount: state.dailySkipCount,
        overrideCount: state.overrideCount,
        permissionStatus: state.permissionStatus,
        protectedAppIds: state.protectedAppIds,
        protectedAppPackageNames: state.protectedAppPackageNames,
        selectedApplicationCount: state.selectedApplicationCount,
        skipDateKey: state.skipDateKey,
        snoozedUntil: state.snoozedUntil,
      }),
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
