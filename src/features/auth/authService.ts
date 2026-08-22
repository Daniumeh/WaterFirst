import type { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import type { HydrationProfile } from '@/src/features/hydration/types';
import { supabase } from '@/src/lib/supabase';

type SignUpWithProfileInput = {
  appPackageNames?: string[];
  email: string;
  password: string;
  profile: HydrationProfile;
  selectedAppIds?: string[];
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

type ProtectedAppsFromUser = {
  appPackageNames: string[];
  selectedAppIds: string[];
};

export function getResetRedirectUrl() {
  const configuredRedirectUrl = process.env.EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_URL;

  if (configuredRedirectUrl) {
    return configuredRedirectUrl;
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location.origin) {
    return `${window.location.origin}/reset-password`;
  }

  return Linking.createURL('reset-password');
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

function readNumberMetadata(value: unknown, fallback: number) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function readStringArrayMetadata(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

export function buildProfileFromUser(user: User): HydrationProfile {
  const metadata = user.user_metadata ?? {};
  const fullName =
    typeof metadata.full_name === 'string'
      ? metadata.full_name
      : typeof metadata.display_name === 'string'
        ? metadata.display_name
        : '';
  const firstName = typeof metadata.first_name === 'string' ? metadata.first_name : '';
  const lastName = typeof metadata.last_name === 'string' ? metadata.last_name : '';
  const fallbackName = fullName || [firstName, lastName].filter(Boolean).join(' ').trim();
  const [derivedFirstName = '', ...derivedRemainingNames] = fallbackName.split(/\s+/);

  return {
    name: fallbackName || user.email?.split('@')[0] || 'WaterFirst User',
    firstName: firstName || derivedFirstName,
    lastName: lastName || derivedRemainingNames.join(' '),
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
    softLockSelectedApplicationCount: readNumberMetadata(
      metadata.soft_lock_selected_application_count,
      0,
    ),
    onboardingComplete: true,
  };
}

export function buildProtectedAppsFromUser(user: User): ProtectedAppsFromUser {
  const metadata = user.user_metadata ?? {};

  return {
    appPackageNames: readStringArrayMetadata(metadata.soft_lock_selected_app_package_names),
    selectedAppIds: readStringArrayMetadata(metadata.soft_lock_selected_app_ids),
  };
}

export async function signUpWithProfile({
  appPackageNames = [],
  email,
  password,
  profile,
  selectedAppIds = [],
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
        display_name: profile.name,
        first_name: profile.firstName,
        full_name: profile.name,
        last_name: profile.lastName,
        notification_consent: profile.notificationConsent,
        onboarding_complete: profile.onboardingComplete,
        sleep_time: profile.sleepTime,
        soft_lock_consent: profile.softLockConsent,
        soft_lock_selected_app_ids: selectedAppIds,
        soft_lock_selected_app_package_names: appPackageNames,
        soft_lock_selected_application_count: profile.softLockSelectedApplicationCount,
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
