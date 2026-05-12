// Supabase client — AsyncStorage adapter for auth tokens (Section 0 forbids MMKV).
// Sensitive bits live in expo-secure-store; the session itself is fine in AsyncStorage.
import { env } from '@/src/lib/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: { 'x-application-name': 'forest-sentry-mobile' },
  },
});
