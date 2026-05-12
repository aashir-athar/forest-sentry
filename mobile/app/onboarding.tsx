// Lever: endowed progress + autonomy — pre-completed Step 1 framing, role choice as commitment.
// Copy: problem-aware audience (the user is a WWF ranger/researcher who already knows the problem).
// Framework: PASTOR — problem → amplify → story (Nathia Gali) → transformation → offer → response.
import { Button } from '@/src/components/Button';
import { Icon } from '@/src/components/Icon';
import { Screen } from '@/src/components/Screen';
import { Surface } from '@/src/components/Surface';
import { Text } from '@/src/components/Text';
import { useColors } from '@/src/theme/ThemeProvider';
import { spacing } from '@/src/theme/spacing';
import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

export default function OnboardingScreen() {
  const colors = useColors();
  const router = useRouter();

  return (
    <Screen edges={['top', 'bottom']} padded scroll={false}>
      <View style={{ flex: 1, justifyContent: 'space-between', paddingTop: spacing.xxl }}>
        <Animated.View entering={FadeIn.duration(360)} style={{ gap: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: colors.brand,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="leaf" size={20} tone="onAccent" color={colors.onBrand} />
            </View>
            <Text variant="titleMD">ForestSentry</Text>
          </View>

          <View style={{ gap: spacing.md }}>
            <Text variant="displayLG">
              The trees won't wait. {`\n`}You shouldn't have to either.
            </Text>
            <Text variant="bodyLG" tone="secondary">
              Tag a tree, classify a leaf, log an incident — every action saved on the device first,
              synced when you reach signal. Built with WWF Pakistan for forests like Nathia Gali.
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(420).delay(160)} style={{ gap: spacing.md }}>
          <Surface variant="elevated" radius="xl" padded depth="low">
            <View style={{ gap: spacing.md }}>
              <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
                <Icon name="navigate-circle" size={22} tone="accent" />
                <View style={{ flex: 1 }}>
                  <Text variant="titleSM">Works without signal</Text>
                  <Text variant="bodySM" tone="secondary">
                    Tag, photograph, classify, and report inside a protected zone with no bars.
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
                <Icon name="hardware-chip" size={22} tone="accent" />
                <View style={{ flex: 1 }}>
                  <Text variant="titleSM">Leaf health on-device</Text>
                  <Text variant="bodySM" tone="secondary">
                    TensorFlow Lite runs locally; a WWF-trained model drops in by swapping one file.
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
                <Icon name="shield-checkmark" size={22} tone="accent" />
                <View style={{ flex: 1 }}>
                  <Text variant="titleSM">Auditable evidence</Text>
                  <Text variant="bodySM" tone="secondary">
                    Each record carries GPS, time, and operator ID so prosecutions hold up.
                  </Text>
                </View>
              </View>
            </View>
          </Surface>

          <Button label="Sign in with email" variant="primary" size="lg" fullWidth onPress={() => router.push('/auth')} />

          <Text variant="caption" tone="tertiary" align="center">
            Your WWF admin sets your role. You can switch view modes in Settings.
          </Text>
        </Animated.View>
      </View>
    </Screen>
  );
}
