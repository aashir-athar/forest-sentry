// Tree detail — identity card, projection chart, inspection timeline.
// Lever: progressive disclosure — projection collapsed under "Trajectory" tap; researcher mode shows raw values.
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { Divider } from '@/src/components/Divider';
import { EmptyState } from '@/src/components/EmptyState';
import { HeaderBar } from '@/src/components/HeaderBar';
import { Icon } from '@/src/components/Icon';
import { Row } from '@/src/components/Row';
import { Screen } from '@/src/components/Screen';
import { Skeleton, SkeletonGroup } from '@/src/components/Skeleton';
import { Stat } from '@/src/components/Stat';
import { Surface } from '@/src/components/Surface';
import { Text } from '@/src/components/Text';
import { TrendChart } from '@/src/components/TrendChart';
import { useInspectionsFor } from '@/src/features/inspections/useInspections';
import type { HealthLabel } from '@/src/features/trees/types';
import { useTree } from '@/src/features/trees/useTrees';
import { formatDateTime, formatLatLng, formatMeters, formatPercent } from '@/src/lib/format';
import { project, type TimeSeriesPoint } from '@/src/lib/projection';
import { useColors } from '@/src/theme/ThemeProvider';
import { spacing } from '@/src/theme/spacing';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';

const HEALTH_TONE: Record<HealthLabel, 'success' | 'warn' | 'danger' | 'alert'> = {
  healthy: 'success',
  stressed: 'warn',
  diseased: 'danger',
  pest: 'alert',
};

export default function TreeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const dims = useWindowDimensions();
  const tree = useTree(id);
  const inspections = useInspectionsFor(id);
  const [showProjection, setShowProjection] = useState(true);

  const series: TimeSeriesPoint[] = useMemo(
    () => (inspections.data ?? []).map((i) => ({ t: new Date(i.createdAt).getTime(), v: i.healthScore })).sort((a, b) => a.t - b.t),
    [inspections.data],
  );

  const projection = useMemo(() => project(series, 4), [series]);

  if (tree.isLoading || !tree.data) {
    return (
      <Screen edges={['top']}>
        <HeaderBar title="Tree" showBack />
        <SkeletonGroup>
          <Skeleton height={120} radius={16} />
          <Skeleton height={240} radius={16} />
          <Skeleton height={80} radius={16} />
        </SkeletonGroup>
      </Screen>
    );
  }

  const t = tree.data;
  const chartWidth = dims.width - spacing.lg * 4;

  return (
    <Screen edges={['top']}>
      <HeaderBar title={t.species} subtitle={formatLatLng(t.lat, t.lng)} showBack />

      <View style={{ gap: spacing.lg }}>
        <Card overline="Identity" title={t.species} subtitle={formatLatLng(t.lat, t.lng)}>
          <View style={{ flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' }}>
            {t.girthCm != null && <Stat label="Girth" value={`${t.girthCm} cm`} />}
            {t.heightM != null && <Stat label="Height" value={formatMeters(t.heightM)} />}
            {t.lastHealthLabel && (
              <View style={{ gap: spacing.xs, justifyContent: 'center' }}>
                <Text variant="overline" tone="tertiary">
                  HEALTH
                </Text>
                <Badge label={t.lastHealthLabel} tone={HEALTH_TONE[t.lastHealthLabel]} />
                {t.lastHealthScore != null && (
                  <Text variant="caption" tone="tertiary">
                    Score {formatPercent(t.lastHealthScore)}
                  </Text>
                )}
              </View>
            )}
          </View>
          {t.photoUri ? (
            <Image
              source={{ uri: t.photoUri }}
              style={{ width: '100%', height: 180, borderRadius: 12, marginTop: spacing.md }}
              contentFit="cover"
            />
          ) : null}
        </Card>

        <Card
          overline="Trajectory"
          title={`Trend: ${projection.trend}`}
          subtitle="Linear projection of recent inspections (next four weeks)."
          trailing={
            <Button
              label={showProjection ? 'Hide' : 'Show'}
              variant="ghost"
              size="sm"
              onPress={() => setShowProjection((v) => !v)}
            />
          }
        >
          {series.length < 2 ? (
            <Text variant="bodyMD" tone="secondary">
              Two inspections unlock the projection. Capture another leaf to see the curve.
            </Text>
          ) : showProjection ? (
            <View style={{ marginTop: spacing.xs }}>
              <TrendChart history={series} projection={projection.projected} width={chartWidth} height={160} />
              <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm, flexWrap: 'wrap' }}>
                <Stat label="EMA" value={formatPercent(projection.emaLast)} />
                <Stat label="Slope/30d" value={`${(projection.slope * 1000 * 60 * 60 * 24 * 30 * 100).toFixed(2)}%`} />
              </View>
            </View>
          ) : null}
        </Card>

        <Card overline="Inspections" title="History">
          {inspections.isLoading ? (
            <SkeletonGroup>
              <Skeleton height={56} />
              <Skeleton height={56} />
            </SkeletonGroup>
          ) : (inspections.data ?? []).length === 0 ? (
            <EmptyState
              image={require('../assets/images/empty-inspections.png')}
              title="No inspections yet"
              body="Run a leaf scan to log the first one. Two inspections unlock the trajectory."
              actionLabel="Inspect a leaf"
              onAction={() => router.push({ pathname: '/inspect', params: { treeId: t.id } })}
            />
          ) : (
            <View>
              {(inspections.data ?? []).map((i, idx) => (
                <View key={i.id}>
                  {idx > 0 && <Divider />}
                  <Row
                    icon={i.healthLabel === 'healthy' ? 'leaf' : i.healthLabel === 'stressed' ? 'sunny' : i.healthLabel === 'diseased' ? 'medkit' : 'bug'}
                    iconTone={i.healthLabel === 'healthy' ? 'success' : i.healthLabel === 'stressed' ? 'secondary' : i.healthLabel === 'diseased' ? 'danger' : 'alert'}
                    title={i.healthLabel.toUpperCase()}
                    subtitle={`${formatDateTime(i.createdAt)} • Score ${formatPercent(i.healthScore)}`}
                    trailingText={i.inferredOnDevice ? 'on-device' : 'cloud'}
                  />
                </View>
              ))}
            </View>
          )}
        </Card>

        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Button
              label="Inspect a leaf"
              iconLeading={<Icon name="scan-circle" size={18} tone="onAccent" />}
              size="lg"
              fullWidth
              onPress={() => router.push({ pathname: '/inspect', params: { treeId: t.id } })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="Open in map" variant="secondary" size="lg" fullWidth iconLeading={<Icon name="map" size={16} />} onPress={() => router.push('/(tabs)/map')} />
          </View>
        </View>

        <Surface variant="solid" padded radius="lg">
          <View style={{ gap: spacing.xs }}>
            <Text variant="overline" tone="tertiary">
              METADATA
            </Text>
            <Text variant="monoSM" tone="tertiary">
              ID {t.id}
            </Text>
            <Text variant="caption" tone="tertiary">
              Created {formatDateTime(t.createdAt)} • {t.synced ? 'Synced' : 'Queued'}
            </Text>
          </View>
        </Surface>
      </View>
    </Screen>
  );
}
