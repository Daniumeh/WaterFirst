import type { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';

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

type SignInWithEmailInput = {
  email: string;
  password: string;
};

function getResetRedirectUrl() {
  return Linking.createURL('/reset-password');
}

function readAuthRedirectParams(url: string) {
  const params = new Map<string, string>();
  const [, queryAndHash = ''] = url.split('?');
  const [query = '', hash = ''] = queryAndHash.split('#');
  const hashOnly = url.includes('#') ? url.split('#')[1] : '';
  const segments = [query, hash, hashOnly].filter(Boolean);

  for (const segment of segments) {
    for (const pair of segment.split('&')) {
      const [rawKey, rawValue = ''] = pair.split('=');
      if (!rawKey) {
        continue;
      }

      params.set(decodeURIComponent(rawKey), decodeURIComponent(rawValue.replace(/\+/g, ' ')));
    }
  }

  return params;
}

export function buildProfileFromUser(user: User): HydrationProfile {
  const metadata = user.user_metadata ?? {};
  const firstName = typeof metadata.first_name === 'string' ? metadata.first_name : '';
  const lastName = typeof metadata.last_name === 'string' ? metadata.last_name : '';
  const fallbackName = [firstName, lastName].filter(Boolean).join(' ').trim();

  return {
    name: fallbackName || user.email?.split('@')[0] || 'HydraLock User',
    firstName,
    lastName,
    email: user.email ?? '',
    weight: typeof metadata.weight === 'number' ? metadata.weight : 180,
    activityLevel:
      metadata.activity_level === 'light' ||
      metadata.activity_level === 'moderate' ||
      metadata.activity_level === 'high'
        ? metadata.activity_level
        : 'moderate',
    activityDescription:
      typeof metadata.activity_description === 'string' ? metadata.activity_description : '',
    climate:
      metadata.climate === 'cool' || metadata.climate === 'temperate' || metadata.climate === 'hot'
        ? metadata.climate
        : 'temperate',
    wakeTime: typeof metadata.wake_time === 'string' ? metadata.wake_time : '07:00',
    sleepTime: typeof metadata.sleep_time === 'string' ? metadata.sleep_time : '22:30',
    unitPreference: metadata.unit_preference === 'metric' ? 'metric' : 'imperial',
    notificationConsent: Boolean(metadata.notification_consent),
    softLockConsent: Boolean(metadata.soft_lock_consent),
    onboardingComplete: true,
  };
}

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

export async function signInWithEmail({
  email,
  password,
}: SignInWithEmailInput): Promise<AuthResult> {
  if (!supabase) {
    throw new Error('Supabase is not configured yet.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return {
    needsEmailConfirmation: false,
    session: data.session,
    user: data.user,
  };
}

export async function requestPasswordReset(email: string) {
  if (!supabase) {
    throw new Error('Supabase is not configured yet.');
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getResetRedirectUrl(),
  });

  if (error) {
    throw error;
  }
}

export async function updatePassword(password: string) {
  if (!supabase) {
    throw new Error('Supabase is not configured yet.');
  }

  const { data, error } = await supabase.auth.updateUser({ password });

  if (error) {
    throw error;
  }

  return data.user;
}

export async function hydrateSessionFromAuthRedirect(url: string) {
  if (!supabase) {
    return false;
  }

  const params = readAuthRedirectParams(url);
  const code = params.get('code');
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      throw error;
    }

    return true;
  }

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      throw error;
    }

    return true;
  }

  return false;
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
