import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

type AuthStore = {
  error: string | null;
  initialized: boolean;
  isLoading: boolean;
  session: Session | null;
  user: User | null;
  setAuthError: (error: string | null) => void;
  setAuthLoading: (isLoading: boolean) => void;
  setSession: (session: Session | null) => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  error: null,
  initialized: false,
  isLoading: true,
  session: null,
  user: null,
  setAuthError: (error) => set({ error }),
  setAuthLoading: (isLoading) => set({ isLoading }),
  setSession: (session) =>
    set({
      initialized: true,
      isLoading: false,
      session,
      user: session?.user ?? null,
    }),
}));
