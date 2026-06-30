import { create } from 'zustand';

import {
  getAccurateLogTimestamp,
  getDeviceNow,
  getLocalDateKey,
  sumLogsForLocalDate,
} from '@/src/features/hydration/deviceTime';
import { calculateProgress, generateCheckpoints } from '@/src/features/hydration/hydrationMath';
import { saveWaterLog } from '@/src/features/hydration/hydrationRepository';
import type {
  HydrationCheckpoint,
  HydrationGoal,
  HydrationLog,
  HydrationProgress,
} from '@/src/features/hydration/types';

const defaultGoal: HydrationGoal = {
  targetMl: 2850,
  manualOverrideMl: null,
  unitPreference: 'imperial',
};

type HydrationStore = {
  activeDateKey: string;
  checkpoints: HydrationCheckpoint[];
  goal: HydrationGoal;
  logs: HydrationLog[];
  progress: HydrationProgress;
  logWater: (amountMl: number) => void;
  setCheckpoints: (checkpoints: HydrationCheckpoint[]) => void;
  setGoal: (goal: HydrationGoal) => void;
  syncWithDeviceDate: () => void;
};

export const useHydrationStore = create<HydrationStore>((set) => ({
  activeDateKey: getLocalDateKey(),
  checkpoints: generateCheckpoints(defaultGoal.targetMl, '07:00', '22:30'),
  goal: defaultGoal,
  logs: [],
  progress: calculateProgress(0, defaultGoal.targetMl),
  logWater: (amountMl) =>
    set((state) => {
      const now = getDeviceNow();
      const activeDateKey = getLocalDateKey(now);
      const safeAmount = Math.max(Math.round(amountMl), 0);

      if (safeAmount === 0) {
        return state;
      }

      const logs = [
        {
          id: `${now.getTime()}-${Math.random().toString(16).slice(2)}`,
          amountMl: safeAmount,
          loggedAt: getAccurateLogTimestamp(now),
        },
        ...state.logs,
      ];
      const loggedMl = sumLogsForLocalDate(logs, now);

      void saveWaterLog(safeAmount, 'quick_log', now);

      return {
        activeDateKey,
        logs,
        progress: calculateProgress(loggedMl, state.goal.targetMl),
      };
    }),
  setCheckpoints: (checkpoints) => set({ checkpoints }),
  setGoal: (goal) =>
    set((state) => ({
      goal,
      progress: calculateProgress(sumLogsForLocalDate(state.logs), goal.targetMl),
    })),
  syncWithDeviceDate: () =>
    set((state) => {
      const now = getDeviceNow();
      const activeDateKey = getLocalDateKey(now);
      const loggedMl = sumLogsForLocalDate(state.logs, now);

      return {
        activeDateKey,
        progress: calculateProgress(loggedMl, state.goal.targetMl),
      };
    }),
}));
