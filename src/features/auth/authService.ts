import type { Session, User } from '@supabase/supabase-js';

import type { HydrationProfile } from '@/src/features/hydration/types';
import { supabase } from '@/src/lib/supabase';

type SignUpWithProfileInput = {
  email: string;
  password: string;
  profile: HydrationProfile;
};

type AuthResult = {
  needsEmailConfirmation: boolean;
  session: Session | null;
  user: User | null;
};

export async function signUpWithProfile({
  email,
  password,
  profile,
}: SignUpWithProfileInput): Promise<AuthResult> {
  if (!supabase) {
    return {
      needsEmailConfirmation: false,
      session: null,
      user: null,
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        activity_description: profile.activityDescription,
        activity_level: profile.activityLevel,
        climate: profile.climate,
        first_name: profile.firstName,
        last_name: profile.lastName,
        notification_consent: profile.notificationConsent,
        onboarding_complete: profile.onboardingComplete,
        sleep_time: profile.sleepTime,
        soft_lock_consent: profile.softLockConsent,
        unit_preference: profile.unitPreference,
        wake_time: profile.wakeTime,
        weight: profile.weight,
      },
    },
  });

  if (error) {
    throw error;
  }

  return {
    needsEmailConfirmation: Boolean(data.user && !data.session),
    session: data.session,
    user: data.user,
  };
}

export async function signOut() {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}
