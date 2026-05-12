// Inspect leaf — on-device classification. TFLite if available, deterministic heuristic otherwise.
// Lever: peak-end + competence — verdict + confidence + clear next step (attach to tree or save standalone).
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { Divider } from '@/src/components/Divider';
import { HeaderBar } from '@/src/components/HeaderBar';
import { Icon } from '@/src/components/Icon';
import { Pill } from '@/src/components/Pill';
import { Screen } from '@/src/components/Screen';
import { Skeleton } from '@/src/components/Skeleton';
import { Text } from '@/src/components/Text';
import { useToast } from '@/src/components/Toast';
import { classifyLeafPhoto, type ClassifyResult } from '@/src/features/inspections/classifier';
import type { HealthLabel } from '@/src/features/trees/types';
import { useRecordInspection, useTrees } from '@/src/features/trees/useTrees';
import { useCapturePhoto } from '@/src/hooks/useCapturePhoto';
import { formatPercent } from '@/src/lib/format';
import { useMlStore } from '@/src/stores/useMlStore';
import { spacing } from '@/src/theme/spacing';
import { useColors } from '@/src/theme/ThemeProvider';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

const HEALTH_TONE: Record<HealthLabel, 'success' | 'warn' | 'danger' | 'alert'> = {
  healthy: 'success',
  stressed: 'warn',
  diseased: 'danger',
  pest: 'alert',
};

const HEALTH_COPY: Record<HealthLabel, { title: string; body: string }> = {
  healthy: { title: 'Healthy', body: 'Colour, hydration, and texture all sit in the normal band.' },
  stressed: { title: 'Stressed', body: 'Drying or pigment shift hinted. Re-inspect in two weeks.' },
  diseased: { title: 'Diseased', body: 'Necrotic patterning detected. Flag for closer botanical review.' },
  pest: { title: 'Pest damage', body: 'Irregular margins or chewed edges. Check the underside.' },
};

export default function InspectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ treeId?: string }>();
  const colors = useColors();
  const { captureFromCamera, pickFromLibrary } = useCapturePhoto();
  const trees = useTrees();
  const record = useRecordInspection();
  const { show } = useToast();

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [result, setResult] = useState<ClassifyResult | null>(null);
  const [running, setRunning] = useState(false);
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(params.treeId ?? null);
  // Operator-confirmed verdict. Defaults to the model's prediction; the
  // operator can override via the pills under the result card. The diff
  // between this and result.label is the training signal.
  const [confirmedLabel, setConfirmedLabel] = useState<HealthLabel | null>(null);
  const trainingOptIn = useMlStore((s) => s.trainingOptIn);

  // Whenever a fresh prediction arrives, seed the confirmed verdict to match it.
  useEffect(() => {
    if (result) setConfirmedLabel(result.label);
  }, [result]);

  const runOn = async (uri: string) => {
    setRunning(true);
    setResult(null);
    try {
      const r = await classifyLeafPhoto(uri);
      setResult(r);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      show({ title: "Couldn't read that leaf", body: error instanceof Error ? error.message : 'Try a closer shot.', tone: 'danger' });
    } finally {
      setRunning(false);
    }
  };

  const onCamera = async () => {
    const uri = await captureFromCamera();
    if (!uri) return;
    setPhotoUri(uri);
    await runOn(uri);
  };
  const onLibrary = async () => {
    const uri = await pickFromLibrary();
    if (!uri) return;
    setPhotoUri(uri);
    await runOn(uri);
  };

  const onAttach = async () => {
    if (!result || !selectedTreeId || !confirmedLabel) return;
    const corrected = confirmedLabel !== result.label;
    try {
      await record.mutateAsync({
        treeId: selectedTreeId,
        // The operator's final verdict — what every downstream chart reads.
        healthLabel: confirmedLabel,
        healthScore: result.score,
        confidence: result.confidence,
        photoUri: photoUri ?? undefined,
        inferredOnDevice: result.source === 'tflite',
        predictedLabel: result.label,
        correctedLabel: corrected ? confirmedLabel : undefined,
        modelVersion: result.modelVersion || undefined,
        predictionSource: result.source,
      });
      show({
        title: corrected ? 'Inspection logged (corrected)' : 'Inspection logged',
        body: corrected
          ? trainingOptIn
            ? 'Thanks — your correction goes to the next training cycle.'
            : 'Filed under your verdict.'
          : 'The tree timeline picks it up immediately.',
        tone: 'success',
      });
      router.replace({ pathname: '/tree-detail', params: { id: selectedTreeId } });
    } catch (error) {
      show({ title: "Couldn't save the inspection", body: error instanceof Error ? error.message : 'Try again.', tone: 'danger' });
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <HeaderBar title="Leaf inspection" subtitle="On-device. Works offline." showBack />

      <View style={{ gap: spacing.lg }}>
        <Card overline="Sample">
          {photoUri ? (
            <Pressable onPress={onCamera} accessibilityRole="button" accessibilityLabel="Replace photo">
              <Image source={{ uri: photoUri }} style={{ width: '100%', height: 220, borderRadius: 12 }} contentFit="cover" />
            </Pressable>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.md }}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: colors.accentMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="leaf" size={32} tone="accent" />
              </View>
              <Text variant="bodyMD" tone="secondary" align="center">
                Fill the frame with a single leaf. Daylight is enough.
              </Text>
            </View>
          )}
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
            <Button label="Camera" iconLeading={<Icon name="camera" size={16} />} onPress={onCamera} />
            <Button label="Library" variant="ghost" iconLeading={<Icon name="images" size={16} />} onPress={onLibrary} />
          </View>
        </Card>

        <Card overline="Verdict">
          {running ? (
            <View style={{ gap: spacing.sm }}>
              <Skeleton height={28} />
              <Skeleton height={14} width="60%" />
              <Skeleton height={14} width="80%" />
            </View>
          ) : result ? (
            <Animated.View entering={FadeIn.duration(220)} style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
                <Text variant="headlineLG">{HEALTH_COPY[result.label].title}</Text>
                <Badge label={HEALTH_COPY[result.label].title} tone={HEALTH_TONE[result.label]} />
              </View>
              <Text variant="bodyMD" tone="secondary">
                {HEALTH_COPY[result.label].body}
              </Text>
              <Text variant="caption" tone="tertiary">
                Confidence {formatPercent(result.confidence)} • {result.source === 'tflite' ? 'TFLite model' : 'On-device heuristic'}
              </Text>
            </Animated.View>
          ) : (
            <Text variant="bodyMD" tone="secondary">
              Capture a leaf above and the verdict appears here in under a second.
            </Text>
          )}
        </Card>

        {result && (
          <Card
            overline="Confirm verdict"
            title="Is the model right?"
            subtitle="Tap to confirm, or pick a different verdict. Your correction trains the next model."
          >
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs }}>
              {(Object.keys(HEALTH_COPY) as HealthLabel[]).map((key) => (
                <Pill
                  key={key}
                  label={HEALTH_COPY[key].title}
                  selected={confirmedLabel === key}
                  onPress={() => setConfirmedLabel(key)}
                />
              ))}
            </View>
            {confirmedLabel && confirmedLabel !== result.label ? (
              <View style={{ marginTop: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Icon name="git-compare" size={14} tone="accent" />
                <Text variant="caption" tone="secondary">
                  Override: model said {HEALTH_COPY[result.label].title.toLowerCase()}, you filed {HEALTH_COPY[confirmedLabel].title.toLowerCase()}.
                </Text>
              </View>
            ) : null}
            {!trainingOptIn ? (
              <View style={{ marginTop: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Icon name="information-circle" size={14} tone="tertiary" />
                <Text variant="caption" tone="tertiary">
                  Training contribution is off. Turn it on in Settings to send confirmed photos to the next training cycle.
                </Text>
              </View>
            ) : null}
            <Divider />
          </Card>
        )}

        {result && (
          <Card overline="Attach to a tree" title="Pick the tree this leaf belongs to.">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.xs }}>
              {(trees.data ?? []).map((t) => {
                const selected = selectedTreeId === t.id;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => setSelectedTreeId(t.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`Attach to ${t.species}`}
                    style={{
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: selected ? colors.accent : colors.border,
                      backgroundColor: selected ? colors.accentMuted : colors.surface,
                    }}
                  >
                    <Text variant="labelMD" style={{ color: selected ? colors.accent : colors.textPrimary }}>
                      {t.species}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={{ marginTop: spacing.md }}>
              <Button
                label={confirmedLabel && confirmedLabel !== result.label ? 'Log correction' : 'Log this inspection'}
                size="lg"
                fullWidth
                disabled={!selectedTreeId || !confirmedLabel}
                loading={record.isPending}
                onPress={onAttach}
                haptic="medium"
              />
            </View>
          </Card>
        )}
      </View>
    </Screen>
  );
}
