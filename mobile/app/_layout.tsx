// Root layout — all providers, fonts, splash gating, auth bootstrap, sync engine.
// Lever: status-quo bias — keep the system theme honored unless the user opts in.
import { queryClient, queryPersister } from '@/src/api/queryClient';
import { ToastProvider } from '@/src/components/Toast';
import { getDb } from '@/src/db/database';
import { useAuthBootstrap } from '@/src/features/auth/useAuth';
import { syncModelRegistry } from '@/src/features/ml/modelRegistry';
import { seedFirstRun } from '@/src/features/seed/seedFirstRun';
import { useSyncQueue } from '@/src/features/sync/useSyncQueue';
import { useLocationWatcher } from '@/src/hooks/useLocationWatcher';
import { errorReporter } from '@/src/lib/errorReporter';
import { ThemeProvider, useColors } from '@/src/theme/ThemeProvider';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts as useInterFonts } from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-url-polyfill/auto';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [fontsLoaded] = useInterFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        await getDb();
        await seedFirstRun();
      } catch (error) {
        errorReporter.capture(error);
      } finally {
        setDbReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (fontsLoaded && dbReady) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, dbReady]);

  if (!fontsLoaded || !dbReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{ persister: queryPersister, maxAge: 1000 * 60 * 60 * 24 * 14 }}
          >
            <BottomSheetModalProvider>
              <ToastProvider>
                <Bootstrap>
                  <Routed />
                </Bootstrap>
              </ToastProvider>
            </BottomSheetModalProvider>
          </PersistQueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function Bootstrap({ children }: { children: React.ReactNode }) {
  useAuthBootstrap();
  useSyncQueue();
  useLocationWatcher(true);

  // Poll the model_versions registry on launch (no-op if not signed in).
  // Best-effort: any failure falls back to the previously cached FS model or
  // the bundled placeholder.
  useEffect(() => {
    void syncModelRegistry();
  }, []);

  return <>{children}</>;
}

function Routed() {
  const colors = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bgBase },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="tree-detail" />
        <Stack.Screen name="capture-tree" />
        <Stack.Screen name="capture-incident" />
        <Stack.Screen name="zone-edit" />
        <Stack.Screen name="inspect" />
        <Stack.Screen name="sync-debug" />
      </Stack>
    </View>
  );
}
