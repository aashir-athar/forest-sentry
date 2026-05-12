// Trees list — filterable; researcher gets export buttons; ranger gets quick tag CTA.
// Lever: chunking + Hick's law — 4 health filter pills, never more.
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { EmptyState } from '@/src/components/EmptyState';
import { HeaderBar } from '@/src/components/HeaderBar';
import { Icon } from '@/src/components/Icon';
import { Pill } from '@/src/components/Pill';
import { Screen } from '@/src/components/Screen';
import { Skeleton, SkeletonGroup } from '@/src/components/Skeleton';
import { Text } from '@/src/components/Text';
import { useToast } from '@/src/components/Toast';
import type { HealthLabel, TreeRecord } from '@/src/features/trees/types';
import { useTrees } from '@/src/features/trees/useTrees';
import { treesToCsv, treesToGeoJSON } from '@/src/lib/export';
import { formatLatLng, formatRelative } from '@/src/lib/format';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { spacing } from '@/src/theme/spacing';
import { useColors } from '@/src/theme/ThemeProvider';
import { FlashList } from '@shopify/flash-list';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useMemo, useState } from 'react';
import { Share, View } from 'react-native';

type Filter = 'all' | HealthLabel;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'healthy', label: 'Healthy' },
  { key: 'stressed', label: 'Stressed' },
  { key: 'diseased', label: 'Diseased' },
  { key: 'pest', label: 'Pest' },
];

export default function TreesTab() {
  const router = useRouter();
  const colors = useColors();
  const role = useAuthStore((s) => s.user?.role ?? 'ranger');
  const trees = useTrees();
  const { show } = useToast();
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    const list = trees.data ?? [];
    if (filter === 'all') return list;
    return list.filter((t) => t.lastHealthLabel === filter);
  }, [trees.data, filter]);

  const exportCsv = async () => {
    if (!trees.data || trees.data.length === 0) {
      show({ title: 'Nothing to export yet', body: 'Tag a tree first, then come back.', tone: 'warn' });
      return;
    }
    const csv = treesToCsv(trees.data);
    const path = `${FileSystem.cacheDirectory}forest-sentry-trees-${Date.now()}.csv`;
    await FileSystem.writeAsStringAsync(path, csv);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path);
    } else {
      await Share.share({ message: csv });
    }
    show({ title: 'CSV ready', body: 'The whole tree dataset is in your share sheet.', tone: 'success' });
  };

  const exportGeoJSON = async () => {
    if (!trees.data || trees.data.length === 0) return;
    const data = treesToGeoJSON(trees.data);
    const path = `${FileSystem.cacheDirectory}forest-sentry-trees-${Date.now()}.geojson`;
    await FileSystem.writeAsStringAsync(path, data);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path);
    }
    show({ title: 'GeoJSON ready', body: 'Open in QGIS or hand to a teammate.', tone: 'success' });
  };

  return (
    <Screen edges={['top']} padded={false} scroll={false}>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <HeaderBar
          title={role === 'researcher' ? 'Dataset' : 'Trees'}
          subtitle={trees.data ? `${trees.data.length} on this device` : ''}
          rightIcon="add"
          onRightPress={() => router.push('/capture-tree')}
          rightAccessibilityLabel="Tag a tree"
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md }}>
          {FILTERS.map((f) => (
            <Pill key={f.key} label={f.label} selected={filter === f.key} onPress={() => setFilter(f.key)} />
          ))}
        </View>
        {role === 'researcher' && (
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
            <Button label="Export CSV" variant="ghost" size="sm" iconLeading={<Icon name="download" size={14} />} onPress={exportCsv} />
            <Button label="Export GeoJSON" variant="ghost" size="sm" iconLeading={<Icon name="globe" size={14} />} onPress={exportGeoJSON} />
          </View>
        )}
      </View>

      {trees.isLoading ? (
        <View style={{ paddingHorizontal: spacing.lg }}>
          <SkeletonGroup>
            <Skeleton height={84} radius={16} />
            <Skeleton height={84} radius={16} />
            <Skeleton height={84} radius={16} />
          </SkeletonGroup>
        </View>
      ) : filtered.length === 0 ? (
        trees.data && trees.data.length > 0 ? (
          <EmptyState
            icon="leaf-outline"
            title="No trees match that filter"
            body="Pick another health state, or clear filters."
            actionLabel="Clear filter"
            onAction={() => setFilter('all')}
          />
        ) : (
          <EmptyState
            image={require('../../assets/images/empty-trees.png')}
            title="No trees yet"
            body="Tagging the first tree takes about 20 seconds. We will not lose it."
            actionLabel="Tag a tree"
            onAction={() => router.push('/capture-tree')}
          />
        )
      ) : (
        <FlashList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing['4xl'] }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item }) => <TreeRow item={item} onPress={() => router.push({ pathname: '/tree-detail', params: { id: item.id } })} />}
        />
      )}
    </Screen>
  );
}

const HEALTH_TONE: Record<HealthLabel, 'success' | 'warn' | 'danger' | 'alert'> = {
  healthy: 'success',
  stressed: 'warn',
  diseased: 'danger',
  pest: 'alert',
};

const TreeRow = React.memo(function TreeRow({ item, onPress }: { item: TreeRecord; onPress: () => void }) {
  const colors = useColors();
  return (
    <Card variant="solid" onTouchEnd={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.bgSunken,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="leaf" tone="accent" />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="titleSM" numberOfLines={1}>
            {item.species}
          </Text>
          <Text variant="bodySM" tone="secondary" numberOfLines={1}>
            {formatLatLng(item.lat, item.lng)} • {formatRelative(item.createdAt)}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          {item.lastHealthLabel ? (
            <Badge label={item.lastHealthLabel} tone={HEALTH_TONE[item.lastHealthLabel]} />
          ) : (
            <Badge label="No data" tone="neutral" />
          )}
          {!item.synced && <Badge label="Queued" tone="warn" />}
        </View>
      </View>
    </Card>
  );
});
