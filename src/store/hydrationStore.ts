import { create } from 'zustand';

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
  checkpoints: HydrationCheckpoint[];
  goal: HydrationGoal;
  logs: HydrationLog[];
  progress: HydrationProgress;
  logWater: (amountMl: number) => void;
  setCheckpoints: (checkpoints: HydrationCheckpoint[]) => void;
  setGoal: (goal: HydrationGoal) => void;
};

export const useHydrationStore = create<HydrationStore>((set) => ({
  checkpoints: generateCheckpoints(defaultGoal.targetMl, '07:00', '22:30'),
  goal: defaultGoal,
  logs: [],
  progress: calculateProgress(0, defaultGoal.targetMl),
  logWater: (amountMl) =>
    set((state) => {
      const safeAmount = Math.max(Math.round(amountMl), 0);

      if (safeAmount === 0) {
        return state;
      }

      const logs = [
        {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          amountMl: safeAmount,
          loggedAt: new Date().toISOString(),
        },
        ...state.logs,
      ];
      const loggedMl = logs.reduce((total, log) => total + log.amountMl, 0);

      void saveWaterLog(safeAmount);

      return {
        logs,
        progress: calculateProgress(loggedMl, state.goal.targetMl),
      };
    }),
  setCheckpoints: (checkpoints) => set({ checkpoints }),
  setGoal: (goal) =>
    set((state) => ({
      goal,
      progress: calculateProgress(state.progress.loggedMl, goal.targetMl),
    })),
}));
