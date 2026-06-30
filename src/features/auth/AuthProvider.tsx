import { useEffect, type PropsWithChildren } from 'react';

import { buildProfileFromUser } from '@/src/features/auth/authService';
import { supabase } from '@/src/lib/supabase';
import { useAuthStore } from '@/src/store/authStore';
import { useProfileStore } from '@/src/store/profileStore';

export function AuthProvider({ children }: PropsWithChildren) {
  const setAuthError = useAuthStore((state) => state.setAuthError);
  const setAuthLoading = useAuthStore((state) => state.setAuthLoading);
  const setSession = useAuthStore((state) => state.setSession);
  const completeOnboarding = useProfileStore((state) => state.completeOnboarding);

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
        if (data.session?.user) {
          completeOnboarding(buildProfileFromUser(data.session.user));
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
      if (session?.user) {
        completeOnboarding(buildProfileFromUser(session.user));
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [completeOnboarding, setAuthError, setAuthLoading, setSession]);

  return children;
}
