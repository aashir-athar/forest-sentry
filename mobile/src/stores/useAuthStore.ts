// Auth + role state. Persists role across sessions; session itself lives in Supabase storage.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'ranger' | 'researcher';

export type AuthUser = {
  id: string;
  email: string;
  displayName?: string;
  role: UserRole;
};

type AuthState = {
  user: AuthUser | null;
  hydrated: boolean;
  setUser: (user: AuthUser | null) => void;
  setRole: (role: UserRole) => void;
  signOut: () => void;
  markHydrated: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      hydrated: false,
      setUser: (user) => set({ user }),
      setRole: (role) => {
        const u = get().user;
        if (u) set({ user: { ...u, role } });
      },
      signOut: () => set({ user: null }),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'forest-sentry:auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ user: s.user }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    },
  ),
);
