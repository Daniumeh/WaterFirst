import { useEffect, type PropsWithChildren } from 'react';

import { supabase } from '@/src/lib/supabase';
import { useAuthStore } from '@/src/store/authStore';

export function AuthProvider({ children }: PropsWithChildren) {
  const setAuthError = useAuthStore((state) => state.setAuthError);
  const setAuthLoading = useAuthStore((state) => state.setAuthLoading);
  const setSession = useAuthStore((state) => state.setSession);

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
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [setAuthError, setAuthLoading, setSession]);

  return children;
}
