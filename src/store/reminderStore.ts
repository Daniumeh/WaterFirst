import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';

type ReminderSettings = {
  activeEnd: string;
  activeStart: string;
  enabled: boolean;
  snoozeMinutes: number;
};

type ReminderStore = {
  pausedUntil: string | null;
  permissionMessage: string | null;
  permissionStatus: string;
  scheduledNotificationIds: string[];
  settings: ReminderSettings;
  pauseUntil: (pausedUntil: string) => void;
  setPermissionState: (status: string, message?: string | null) => void;
  setScheduledNotificationIds: (ids: string[]) => void;
  updateSettings: (settings: Partial<ReminderSettings>) => void;
};

export const useReminderStore = create<ReminderStore>()(
  persist(
    (set) => ({
      pausedUntil: null,
      permissionMessage: null,
      permissionStatus: 'Not requested',
      scheduledNotificationIds: [],
      settings: {
        activeStart: '07:00',
        activeEnd: '22:30',
        enabled: true,
        snoozeMinutes: 30,
      },
      pauseUntil: (pausedUntil) => set({ pausedUntil }),
      setPermissionState: (permissionStatus, permissionMessage = null) =>
        set({ permissionMessage, permissionStatus }),
      setScheduledNotificationIds: (scheduledNotificationIds) => set({ scheduledNotificationIds }),
      updateSettings: (settings) =>
        set((state) => ({
          settings: { ...state.settings, ...settings },
        })),
    }),
    {
      name: 'waterfirst-reminders',
      partialize: (state) => ({
        pausedUntil: state.pausedUntil,
        permissionMessage: state.permissionMessage,
        permissionStatus: state.permissionStatus,
        scheduledNotificationIds: state.scheduledNotificationIds,
        settings: state.settings,
      }),
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
