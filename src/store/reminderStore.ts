import { create } from 'zustand';

type ReminderSettings = {
  activeEnd: string;
  activeStart: string;
  enabled: boolean;
  snoozeMinutes: number;
};

type ReminderStore = {
  pausedUntil: string | null;
  settings: ReminderSettings;
  pauseUntil: (pausedUntil: string) => void;
  updateSettings: (settings: Partial<ReminderSettings>) => void;
};

export const useReminderStore = create<ReminderStore>((set) => ({
  pausedUntil: null,
  settings: {
    activeStart: '07:00',
    activeEnd: '22:30',
    enabled: true,
    snoozeMinutes: 30,
  },
  pauseUntil: (pausedUntil) => set({ pausedUntil }),
  updateSettings: (settings) =>
    set((state) => ({
      settings: { ...state.settings, ...settings },
    })),
}));
