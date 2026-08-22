import { useCallback, useEffect, type PropsWithChildren } from 'react';
import * as Linking from 'expo-linking';

import {
  buildProfileFromUser,
  buildProtectedAppsFromUser,
  hydrateSessionFromAuthRedirect,
} from '@/src/features/auth/authService';
import { supabase } from '@/src/lib/supabase';
import { useAccountabilityStore } from '@/src/store/accountabilityStore';
import { useAuthStore } from '@/src/store/authStore';
import { useProfileStore } from '@/src/store/profileStore';

export function AuthProvider({ children }: PropsWithChildren) {
  const setAuthError = useAuthStore((state) => state.setAuthError);
  const setAuthLoading = useAuthStore((state) => state.setAuthLoading);
  const setSession = useAuthStore((state) => state.setSession);
  const setHydrationShieldPermissionStatus = useAccountabilityStore(
    (state) => state.setHydrationShieldPermissionStatus,
  );
  const setProtectedApps = useAccountabilityStore((state) => state.setProtectedApps);
  const completeOnboarding = useProfileStore((state) => state.completeOnboarding);
  const pendingOnboardingPlan = useProfileStore((state) => state.pendingOnboardingPlan);

  const restoreOnboardingFromUser = useCallback(
    (user: Parameters<typeof buildProfileFromUser>[0]) => {
      const profile = buildProfileFromUser(user);
      const protectedApps = buildProtectedAppsFromUser(user);

      setProtectedApps(protectedApps.selectedAppIds, protectedApps.appPackageNames);
      setHydrationShieldPermissionStatus(profile.softLockConsent ? 'enabled' : 'disabled');
      completeOnboarding(profile);
    },
    [completeOnboarding, setHydrationShieldPermissionStatus, setProtectedApps],
  );

  useEffect(() => {
    if (!supabase) {
      setSession(null);
      setAuthLoading(false);
      return undefined;
    }

    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) {
          return;
        }

        setAuthError(error?.message ?? null);
        setSession(data.session);
        if (data.session?.user && !pendingOnboardingPlan) {
          restoreOnboardingFromUser(data.session.user);
        }
      })
      .catch((error: Error) => {
        if (!isMounted) {
          return;
        }

        setAuthError(error.message);
        setSession(null);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthError(null);
      setSession(session);
      if (session?.user && !useProfileStore.getState().pendingOnboardingPlan) {
        restoreOnboardingFromUser(session.user);
      }
    });

    Linking.getInitialURL()
      .then((url) => {
        if (!url || !isMounted) {
          return;
        }

        return hydrateSessionFromAuthRedirect(url);
      })
      .catch((error: Error) => {
        if (isMounted) {
          setAuthError(error.message);
        }
      });

    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      void hydrateSessionFromAuthRedirect(url).catch((error: Error) => {
        setAuthError(error.message);
      });
    });

    return () => {
      isMounted = false;
      linkingSubscription.remove();
      subscription.unsubscribe();
    };
  }, [
    completeOnboarding,
    pendingOnboardingPlan,
    restoreOnboardingFromUser,
    setAuthError,
    setAuthLoading,
    setHydrationShieldPermissionStatus,
    setProtectedApps,
    setSession,
  ]);

  return children;
}
