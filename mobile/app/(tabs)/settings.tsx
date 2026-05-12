// Settings — role switcher, theme, high-visibility mode, AI engine status, sign out.
// Lever: autonomy (SDT) — make every preference visible and reversible.
import { Button } from '@/src/components/Button';
import { Divider } from '@/src/components/Divider';
import { HeaderBar } from '@/src/components/HeaderBar';
import { Pill } from '@/src/components/Pill';
import { Row } from '@/src/components/Row';
import { Screen } from '@/src/components/Screen';
import { Surface } from '@/src/components/Surface';
import { Text } from '@/src/components/Text';
import { useToast } from '@/src/components/Toast';
import { signOut as supabaseSignOut } from '@/src/features/auth/useAuth';
import { probeClassifier } from '@/src/features/inspections/classifier';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { useMlStore } from '@/src/stores/useMlStore';
import { spacing } from '@/src/theme/spacing';
import { useColors, useTheme } from '@/src/theme/ThemeProvider';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Switch, View } from 'react-native';

export default function SettingsTab() {
  const colors = useColors();
  const router = useRouter();
  const { mode, setMode, highVisibility, setHighVisibility } = useTheme();
  const user = useAuthStore((s) => s.user);
  const setRole = useAuthStore((s) => s.setRole);
  const signOutLocal = useAuthStore((s) => s.signOut);
  const trainingOptIn = useMlStore((s) => s.trainingOptIn);
  const setTrainingOptIn = useMlStore((s) => s.setTrainingOptIn);
  const activeLeafModel = useMlStore((s) => s.activeModels['leaf-health']);
  const { show } = useToast();
  const [aiSource, setAiSource] = useState<'tflite' | 'heuristic'>('heuristic');

  useEffect(() => {
    void probeClassifier().then((r) => setAiSource(r.source));
  }, []);

  const handleSignOut = async () => {
    try {
      await supabaseSignOut();
    } finally {
      signOutLocal();
      router.replace('/onboarding');
    }
  };

  const switchRole = (next: 'ranger' | 'researcher') => {
    setRole(next);
    show({ title: `Now in ${next} mode`, body: 'The tabs and quick actions rearrange to match.', tone: 'info' });
  };

  return (
    <Screen edges={['top']}>
      <HeaderBar title="Settings" subtitle={user?.email ?? ''} />

      <Surface variant="solid" radius="lg" style={{ marginBottom: spacing.lg }}>
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <Text variant="overline" tone="tertiary">
            ROLE
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Pill label="Ranger" selected={user?.role === 'ranger'} onPress={() => switchRole('ranger')} />
            <Pill label="Researcher" selected={user?.role === 'researcher'} onPress={() => switchRole('researcher')} />
          </View>
          <Text variant="caption" tone="tertiary">
            Rangers see large field actions. Researchers see data exports and analytics.
          </Text>
        </View>
      </Surface>

      <Surface variant="solid" radius="lg" style={{ marginBottom: spacing.lg }}>
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <Text variant="overline" tone="tertiary">
            APPEARANCE
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Pill label="System" selected={mode === 'system'} onPress={() => setMode('system')} />
            <Pill label="Light" selected={mode === 'light'} onPress={() => setMode('light')} />
            <Pill label="Dark" selected={mode === 'dark'} onPress={() => setMode('dark')} />
          </View>
          <Divider />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text variant="titleSM">High visibility</Text>
              <Text variant="bodySM" tone="secondary">
                Maximum-contrast tokens for direct sun. No translucency, thicker borders, bolder type.
              </Text>
            </View>
            <Switch
              value={highVisibility}
              onValueChange={setHighVisibility}
              trackColor={{ true: colors.accent, false: colors.border }}
              thumbColor={colors.surface}
              accessibilityLabel="High visibility mode"
            />
          </View>
        </View>
      </Surface>

      <Surface variant="solid" radius="lg" style={{ marginBottom: spacing.lg }}>
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <Text variant="overline" tone="tertiary">
            TRAINING CONTRIBUTION
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text variant="titleSM">Help train the next model</Text>
              <Text variant="bodySM" tone="secondary">
                Share confirmed inspection photos with the WWF training pipeline. Photos that contain identifiable people are stripped of EXIF location before upload.
              </Text>
            </View>
            <Switch
              value={trainingOptIn}
              onValueChange={setTrainingOptIn}
              trackColor={{ true: colors.accent, false: colors.border }}
              thumbColor={colors.surface}
              accessibilityLabel="Contribute photos to model training"
            />
          </View>
          {activeLeafModel ? (
            <Text variant="caption" tone="tertiary">
              Active leaf model: {activeLeafModel.tag} • {activeLeafModel.sampleCount.toLocaleString()} training samples
              {activeLeafModel.validationAcc != null ? ` • ${(activeLeafModel.validationAcc * 100).toFixed(1)}% val accuracy` : ''}
            </Text>
          ) : (
            <Text variant="caption" tone="tertiary">
              No production model on this device yet — bundled placeholder in use. A trained model will install automatically once one is promoted.
            </Text>
          )}
        </View>
      </Surface>

      <Surface variant="solid" radius="lg" style={{ marginBottom: spacing.lg }}>
        <Row icon="hardware-chip" iconTone="info" title="AI engine" subtitle={aiSource === 'tflite' ? 'Bundled TensorFlow Lite model is live.' : 'Heuristic fallback active — build a custom dev client to link the native TFLite module.'} />
        <Divider inset={68} />
        <Row icon="cloud-upload" iconTone="info" title="Sync debug" subtitle="See queue, attempt a manual drain, inspect errors." showChevron onPress={() => router.push('/sync-debug')} />
        <Divider inset={68} />
        <Row icon="information-circle" iconTone="info" title="About ForestSentry" subtitle="Built with WWF Pakistan — open source, MIT." />
      </Surface>

      <Button label="Sign out" variant="ghost" fullWidth onPress={handleSignOut} />
    </Screen>
  );
}
