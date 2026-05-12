// Strongly-typed environment access; throws in dev if a required var is missing.
import { errorReporter } from './errorReporter';

function read(key: string): string {
  const value = process.env[key] ?? '';
  if (!value) {
    errorReporter.warn(`Missing env var: ${key}. Copy .env.example to .env and fill values.`);
  }
  return value;
}

export const env = {
  supabaseUrl: read('EXPO_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: read('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  appEnv: (process.env.EXPO_PUBLIC_APP_ENV ?? 'development') as 'development' | 'preview' | 'production',
};
