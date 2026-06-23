import { create } from 'zustand';

type AccountabilityStore = {
  overrideCount: number;
  snoozedUntil: string | null;
  recordOverride: () => void;
  snoozeUntil: (snoozedUntil: string) => void;
};

export const useAccountabilityStore = create<AccountabilityStore>((set) => ({
  overrideCount: 0,
  snoozedUntil: null,
  recordOverride: () =>
    set((state) => ({
      overrideCount: state.overrideCount + 1,
      snoozedUntil: null,
    })),
  snoozeUntil: (snoozedUntil) => set({ snoozedUntil }),
}));
