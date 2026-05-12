// Field Home (rangers) / Overview (researchers) — split by role, single component.
// Lever (ranger): Fitts's Law + peak-end — oversized edge-aligned primary actions; finish each capture with a satisfying confirmation.
// Lever (researcher): progressive disclosure — collapsed analytics expand on tap; data dense without being noisy.
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { EmptyState } from '@/src/components/EmptyState';
import { HeaderBar } from '@/src/components/HeaderBar';
import { Icon } from '@/src/components/Icon';
import { Pill } from '@/src/components/Pill';
import { Row } from '@/src/components/Row';
import { Screen } from '@/src/components/Screen';
import { Skeleton, SkeletonGroup } from '@/src/components/Skeleton';
import { Stat } from '@/src/components/Stat';
import { Surface } from '@/src/components/Surface';
import { Text } from '@/src/components/Text';
import { useIncidents } from '@/src/features/incidents/useIncidents';
import { useTrees } from '@/src/features/trees/useTrees';
import { useZones } from '@/src/features/zones/useZones';
import { formatLatLng, formatRelative } from '@/src/lib/format';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { useLocationStore } from '@/src/stores/useLocationStore';
import { useSyncStore } from '@/src/stores/useSyncStore';
import { spacing } from '@/src/theme/spacing';
import { useColors, useTheme } from '@/src/theme/ThemeProvider';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { RefreshControl, View } from 'react-native';

export default function HomeTab() {
  const router = useRouter();
  const colors = useColors();
  const { highVisibility } = useTheme();
  const role = useAuthStore((s) => s.user?.role ?? 'ranger');
  const displayName = useAuthStore((s) => s.user?.displayName ?? 'there');

  const trees = useTrees();
  const incidents = useIncidents();
  const zones = useZones();

  const pending = useSyncStore((s) => s.pending);
  const isOnline = useSyncStore((s) => s.isOnline);
  const isDraining = useSyncStore((s) => s.isDraining);
  const lastSyncIso = useSyncStore((s) => s.lastSyncIso);
  const current = useLocationStore((s) => s.current);
  const insideZoneId = useLocationStore((s) => s.insideZoneId);

  const insideZone = useMemo(() => (zones.data ?? []).find((z) => z.id === insideZoneId) ?? null, [zones.data, insideZoneId]);

  const todayIso = new Date().toISOString().slice(0, 10);
  const todaysTrees = (trees.data ?? []).filter((t) => t.createdAt.startsWith(todayIso));
  const todaysIncidents = (incidents.data ?? []).filter((i) => i.createdAt.startsWith(todayIso));
  const pendingTotal = pending.trees + pending.inspections + pending.incidents + pending.zones;

  const refreshing = trees.isRefetching || incidents.isRefetching || zones.isRefetching;
  const reload = () => {
    void trees.refetch();
    void incidents.refetch();
    void zones.refetch();
  };

  return (
    <Screen
      edges={['top']}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={colors.accent} />}
    >
      <HeaderBar
        title={role === 'researcher' ? 'Overview' : `Hi, ${displayName.split(' ')[0]}`}
        subtitle={role === 'researcher' ? 'Live state of the field dataset' : insideZone ? `Inside ${insideZone.name}` : 'Outside protected zones'}
        rightIcon="sync"
        onRightPress={() => router.push('/sync-debug')}
        rightAccessibilityLabel="Open sync debug"
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
        <Badge label={isOnline ? 'Online' : 'Offline'} tone={isOnline ? 'success' : 'warn'} />
        {pendingTotal > 0 && (
          <Badge label={`${pendingTotal} unsynced`} tone={isDraining ? 'info' : 'neutral'} />
        )}
        {highVisibility && <Badge label="Sun mode" tone="alert" />}
      </View>

      {role === 'ranger' ? (
        <RangerHome
          onTagTree={() => router.push('/capture-tree')}
          onReportIncident={() => router.push('/capture-incident')}
          onInspect={() => router.push('/inspect')}
          insideZoneName={insideZone?.name}
          isOnline={isOnline}
          pendingTotal={pendingTotal}
          lastSyncIso={lastSyncIso}
          coords={current ? formatLatLng(current.lat, current.lng) : 'No GPS lock yet'}
        />
      ) : (
        <ResearcherHome
          trees={trees.data?.length ?? 0}
          incidents={incidents.data?.length ?? 0}
          zones={zones.data?.length ?? 0}
          loading={trees.isLoading || incidents.isLoading || zones.isLoading}
        />
      )}

      <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="headlineSM">Today</Text>
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            <Pill label="All" selected />
            <Pill label="Mine" />
          </View>
        </View>

        {trees.isLoading ? (
          <SkeletonGroup>
            <Skeleton height={64} radius={16} />
            <Skeleton height={64} radius={16} />
            <Skeleton height={64} radius={16} />
          </SkeletonGroup>
        ) : todaysTrees.length === 0 && todaysIncidents.length === 0 ? (
          <EmptyState
            icon="footsteps"
            title="No field actions yet today"
            body="Tag the first tree of the morning or log what you saw on the trail."
            actionLabel="Tag a tree"
            onAction={() => router.push('/capture-tree')}
            secondaryLabel="Log incident"
            onSecondary={() => router.push('/capture-incident')}
          />
        ) : (
          <Surface variant="solid" radius="lg">
            {todaysTrees.map((t, idx) => (
              <View key={t.id}>
                {idx > 0 && <View style={{ height: 1, backgroundColor: colors.divider, marginLeft: 68 }} />}
                <Row
                  icon="leaf"
                  iconTone="accent"
                  title={t.species}
                  subtitle={`${formatLatLng(t.lat, t.lng)} • ${formatRelative(t.createdAt)}`}
                  trailing={!t.synced ? <Badge label="Queued" tone="warn" /> : <Icon name="cloud-done" tone="success" size={18} />}
                  showChevron
                  onPress={() => router.push({ pathname: '/tree-detail', params: { id: t.id } })}
                />
              </View>
            ))}
            {todaysIncidents.length > 0 && todaysTrees.length > 0 && (
              <View style={{ height: 1, backgroundColor: colors.divider, marginLeft: 68 }} />
            )}
            {todaysIncidents.map((i, idx) => (
              <View key={i.id}>
                {idx > 0 && <View style={{ height: 1, backgroundColor: colors.divider, marginLeft: 68 }} />}
                <Row
                  icon="alert-circle"
                  iconTone="alert"
                  title={
                    i.severity === 'critical' ? 'Critical incident' : i.severity === 'serious' ? 'Serious incident' : i.severity === 'minor' ? 'Minor incident' : 'Observation'
                  }
                  subtitle={`${i.notes?.slice(0, 80) ?? ''} • ${formatRelative(i.createdAt)}`}
                  trailing={!i.synced ? <Badge label="Queued" tone="warn" /> : <Icon name="cloud-done" tone="success" size={18} />}
                />
              </View>
            ))}
          </Surface>
        )}
      </View>
    </Screen>
  );
}

function RangerHome({
  onTagTree,
  onReportIncident,
  onInspect,
  insideZoneName,
  isOnline,
  pendingTotal,
  lastSyncIso,
  coords,
}: {
  onTagTree: () => void;
  onReportIncident: () => void;
  onInspect: () => void;
  insideZoneName?: string;
  isOnline: boolean;
  pendingTotal: number;
  lastSyncIso?: string;
  coords: string;
}) {
  return (
    <View style={{ gap: spacing.lg }}>
      <Surface variant="glass" radius="xl" padded depth="medium">
        <View style={{ gap: spacing.md }}>
          <Text variant="overline" tone="tertiary">
            CURRENT POSITION
          </Text>
          <Text variant="displayMD">{coords}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Icon name={insideZoneName ? 'shield-checkmark' : 'shield-outline'} size={16} tone={insideZoneName ? 'accent' : 'tertiary'} />
            <Text variant="bodySM" tone="secondary">
              {insideZoneName ? `Inside ${insideZoneName}` : 'Outside protected zones'}
            </Text>
          </View>
        </View>
      </Surface>

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Button label="Tag a tree" size="xl" fullWidth iconLeading={<Icon name="add-circle" size={20} tone="onAccent" />} onPress={onTagTree} />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label="Report incident"
            size="xl"
            variant="alert"
            fullWidth
            iconLeading={<Icon name="warning" size={20} tone="onAccent" />}
            onPress={onReportIncident}
          />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <Button label="Inspect a leaf" variant="secondary" size="lg" fullWidth iconLeading={<Icon name="scan-circle" size={18} />} onPress={onInspect} />
      </View>

      <Card overline="Status" title={isOnline ? (pendingTotal > 0 ? `${pendingTotal} records syncing` : 'All synced') : 'Working offline'} subtitle={lastSyncIso ? `Last sync ${formatRelative(lastSyncIso)}` : 'Sync runs the moment you have signal.'} />
    </View>
  );
}

function ResearcherHome({ trees, incidents, zones, loading }: { trees: number; incidents: number; zones: number; loading: boolean }) {
  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <Surface variant="elevated" radius="lg" padded depth="low" style={{ flex: 1 }}>
          {loading ? <Skeleton height={48} /> : <Stat label="Trees" value={trees.toString()} />}
        </Surface>
        <Surface variant="elevated" radius="lg" padded depth="low" style={{ flex: 1 }}>
          {loading ? <Skeleton height={48} /> : <Stat label="Incidents" value={incidents.toString()} tone={incidents > 0 ? 'alert' : 'default'} />}
        </Surface>
        <Surface variant="elevated" radius="lg" padded depth="low" style={{ flex: 1 }}>
          {loading ? <Skeleton height={48} /> : <Stat label="Zones" value={zones.toString()} />}
        </Surface>
      </View>
    </View>
  );
}
