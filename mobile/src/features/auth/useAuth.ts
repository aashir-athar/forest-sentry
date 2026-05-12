// Supabase email-OTP auth, wired into Zustand for app-wide role + identity.
// The flow is: request a 6-digit token by email, verify it in-app. No deep-link
// handling, no magic-link URL fragility — works on any device with any email
// client.
import { supabase } from '@/src/api/supabaseClient';
import { errorReporter } from '@/src/lib/errorReporter';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { useEffect } from 'react';

export function useAuthBootstrap() {
  const setUser = useAuthStore((s) => s.setUser);
  const markHydrated = useAuthStore((s) => s.markHydrated);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        if (!active) return;
        if (session?.user) {
          const meta = session.user.user_metadata as Record<string, unknown> | null;
          setUser({
            id: session.user.id,
            email: session.user.email ?? '',
            displayName: typeof meta?.display_name === 'string' ? (meta.display_name as string) : undefined,
            role: ((meta?.role as 'ranger' | 'researcher') ?? 'ranger') satisfies 'ranger' | 'researcher',
          });
        }
      } catch (error) {
        errorReporter.capture(error);
      } finally {
        markHydrated();
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null);
        return;
      }
      const meta = session.user.user_metadata as Record<string, unknown> | null;
      setUser({
        id: session.user.id,
        email: session.user.email ?? '',
        displayName: typeof meta?.display_name === 'string' ? (meta.display_name as string) : undefined,
        role: ((meta?.role as 'ranger' | 'researcher') ?? 'ranger') satisfies 'ranger' | 'researcher',
      });
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [setUser, markHydrated]);
}

// Send a 6-digit code to the user's inbox. Supabase will create the user on
// first request if they don't exist yet — pair this with admin-side role
// metadata so the user lands in the correct role on verify.
export async function requestEmailOtp(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  if (error) throw error;
}

// Verify the 6-digit code. On success the session is created and
// onAuthStateChange in useAuthBootstrap will populate the Zustand user.
export async function verifyEmailOtp(email: string, token: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
