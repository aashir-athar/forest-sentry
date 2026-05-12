// Sync debug — counts, manual drain, last error.
// Lever: trust through transparency — show the queue rather than hide the magic.
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { Divider } from '@/src/components/Divider';
import { HeaderBar } from '@/src/components/HeaderBar';
import { Row } from '@/src/components/Row';
import { Screen } from '@/src/components/Screen';
import { Stat } from '@/src/components/Stat';
import { Text } from '@/src/components/Text';
import { useToast } from '@/src/components/Toast';
import { countsForSync, drainSyncQueue } from '@/src/features/sync/syncEngine';
import { formatRelative } from '@/src/lib/format';
import { useSyncStore } from '@/src/stores/useSyncStore';
import { spacing } from '@/src/theme/spacing';
import NetInfo from '@react-native-community/netinfo';
import React, { useState } from 'react';
import { View } from 'react-native';

export default function SyncDebugScreen() {
  const { show } = useToast();
  const pending = useSyncStore((s) => s.pending);
  const isOnline = useSyncStore((s) => s.isOnline);
  const lastSyncIso = useSyncStore((s) => s.lastSyncIso);
  const lastError = useSyncStore((s) => s.lastError);
  const setPending = useSyncStore((s) => s.setPending);
  const setDraining = useSyncStore((s) => s.setDraining);
  const isDraining = useSyncStore((s) => s.isDraining);
  const [busy, setBusy] = useState(false);

  const refreshCounts = async () => {
    const c = await countsForSync();
    setPending(c);
  };

  const drainNow = async () => {
    if (!isOnline) {
      show({ title: "You're offline", body: 'The drain runs the moment signal returns — no manual push needed in the field.', tone: 'warn' });
      return;
    }
    setBusy(true);
    setDraining(true);
    try {
      const r = await drainSyncQueue();
      await refreshCounts();
      show({
        title: r.failed === 0 ? 'Queue drained' : 'Drained with errors',
        body: `${r.succeeded} sent · ${r.failed} failed`,
        tone: r.failed === 0 ? 'success' : 'warn',
      });
    } finally {
      setBusy(false);
      setDraining(false);
    }
  };

  return (
    <Screen edges={['top']}>
      <HeaderBar title="Sync debug" subtitle="See what's queued and why." showBack rightIcon="refresh" onRightPress={refreshCounts} rightAccessibilityLabel="Refresh counts" />

      <View style={{ gap: spacing.lg }}>
        <Card overline="Network">
          <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
            <Badge label={isOnline ? 'Online' : 'Offline'} tone={isOnline ? 'success' : 'warn'} />
            <Text variant="bodySM" tone="secondary">
              {lastSyncIso ? `Last sync ${formatRelative(lastSyncIso)}` : 'No sync yet this session.'}
            </Text>
          </View>
          {lastError ? (
            <Text variant="caption" tone="danger" style={{ marginTop: spacing.sm }}>
              Last error: {lastError}
            </Text>
          ) : null}
        </Card>

        <Card overline="Queue">
          <View style={{ flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' }}>
            <Stat label="Zones" value={pending.zones.toString()} tone={pending.zones > 0 ? 'accent' : 'default'} />
            <Stat label="Trees" value={pending.trees.toString()} tone={pending.trees > 0 ? 'accent' : 'default'} />
            <Stat label="Inspections" value={pending.inspections.toString()} tone={pending.inspections > 0 ? 'accent' : 'default'} />
            <Stat label="Incidents" value={pending.incidents.toString()} tone={pending.incidents > 0 ? 'alert' : 'default'} />
          </View>
        </Card>

        <Card overline="Actions">
          <Row icon="cloud-upload" iconTone="info" title="Drain now" subtitle="Force a sync attempt right now (still needs signal)." onPress={drainNow} showChevron />
          <Divider inset={68} />
          <Row icon="wifi" iconTone="info" title="Check connectivity" subtitle="Probe the network and refresh the state." onPress={async () => {
            const s = await NetInfo.fetch();
            show({ title: s.isConnected ? 'Connected' : 'Disconnected', body: `Type: ${s.type}`, tone: s.isConnected ? 'success' : 'warn' });
          }} showChevron />
        </Card>

        <Button label={busy ? 'Working...' : isDraining ? 'Background sync running...' : 'Drain queue'} fullWidth size="lg" onPress={drainNow} loading={busy} />
      </View>
    </Screen>
  );
}
