// Zone editor — tap on the map to drop polygon vertices; save with name + protection level.
// Lever: commitment + endowed progress — once you've placed 3 points, the user wants to finish the polygon.
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { HeaderBar } from '@/src/components/HeaderBar';
import { Icon } from '@/src/components/Icon';
import { Input } from '@/src/components/Input';
import { Pill } from '@/src/components/Pill';
import { Screen } from '@/src/components/Screen';
import { Surface } from '@/src/components/Surface';
import { Text } from '@/src/components/Text';
import { useToast } from '@/src/components/Toast';
import type { ProtectionLevel } from '@/src/features/zones/types';
import { useCreateOrUpdateZone } from '@/src/features/zones/useZones';
import type { LatLng } from '@/src/lib/geo';
import { zoneFormSchema, type ZoneFormValues } from '@/src/schemas/zone';
import { useLocationStore } from '@/src/stores/useLocationStore';
import { useColors } from '@/src/theme/ThemeProvider';
import { spacing } from '@/src/theme/spacing';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import MapView, { Marker, Polygon, type MapPressEvent } from 'react-native-maps';

const LEVELS: { key: ProtectionLevel; label: string; helper: string }[] = [
  { key: 'monitor', label: 'Monitor', helper: 'Observation-only buffer.' },
  { key: 'restricted', label: 'Restricted', helper: 'No logging; access permits required.' },
  { key: 'core', label: 'Core', helper: 'Strict protection. Any entry triggers an alert.' },
];

export default function ZoneEditScreen() {
  const router = useRouter();
  const colors = useColors();
  const { show } = useToast();
  const save = useCreateOrUpdateZone();
  const current = useLocationStore((s) => s.current);
  const [points, setPoints] = useState<LatLng[]>([]);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ZoneFormValues>({
    resolver: zodResolver(zoneFormSchema),
    defaultValues: { name: '', protectionLevel: 'restricted', notes: '' },
  });

  const level = watch('protectionLevel');

  const onMapPress = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setPoints((prev) => [...prev, { lat: latitude, lng: longitude }]);
  };

  const undo = () => setPoints((prev) => prev.slice(0, -1));
  const clear = () => setPoints([]);

  const onSubmit = async (values: ZoneFormValues) => {
    if (points.length < 3) {
      show({ title: 'Need at least 3 points', body: 'A zone is a polygon — tap the map to drop vertices.', tone: 'warn' });
      return;
    }
    try {
      await save.mutateAsync({ ...values, boundary: points });
      show({ title: 'Zone saved', body: 'It joins the others on the map and syncs when online.', tone: 'success' });
      router.back();
    } catch (error) {
      show({ title: "Couldn't save zone", body: error instanceof Error ? error.message : 'Try again.', tone: 'danger' });
    }
  };

  const initial = current
    ? { latitude: current.lat, longitude: current.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : { latitude: 34.0762, longitude: 73.3953, latitudeDelta: 0.04, longitudeDelta: 0.04 };

  return (
    <Screen edges={['top']} padded={false} scroll={false}>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <HeaderBar title="Draw a zone" subtitle="Tap the map to lay vertices." showBack rightIcon="trash" onRightPress={clear} rightAccessibilityLabel="Clear all points" />
      </View>

      <View style={{ flex: 1, marginHorizontal: spacing.lg, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
        <MapView style={{ flex: 1 }} initialRegion={initial} onPress={onMapPress} mapType="hybrid">
          {points.length >= 3 && (
            <Polygon
              coordinates={points.map((p) => ({ latitude: p.lat, longitude: p.lng }))}
              fillColor={colors.mapZoneFill}
              strokeColor={colors.mapZoneStroke}
              strokeWidth={2}
            />
          )}
          {points.map((p, idx) => (
            <Marker
              key={`${p.lat}-${p.lng}-${idx}`}
              coordinate={{ latitude: p.lat, longitude: p.lng }}
              title={`Point ${idx + 1}`}
              pinColor="#5A7F4A"
            />
          ))}
        </MapView>
      </View>

      <Surface variant="glass" radius="xl" depth="medium" padded style={{ margin: spacing.lg }}>
        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Badge label={`${points.length} points`} tone={points.length >= 3 ? 'accent' : 'neutral'} />
            <Button label="Undo last" variant="ghost" size="sm" iconLeading={<Icon name="arrow-undo" size={14} />} onPress={undo} disabled={points.length === 0} />
          </View>

          <Controller
            control={control}
            name="name"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Zone name"
                placeholder="Nathia Gali Ridge - West"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.name?.message}
              />
            )}
          />

          <View style={{ gap: spacing.xs }}>
            <Text variant="labelMD" tone="secondary">
              Protection level
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              {LEVELS.map((l) => (
                <Pill key={l.key} label={l.label} selected={level === l.key} onPress={() => setValue('protectionLevel', l.key, { shouldDirty: true })} />
              ))}
            </View>
            <Text variant="caption" tone="tertiary">
              {LEVELS.find((l) => l.key === level)?.helper}
            </Text>
          </View>

          <Button label="Save zone" size="lg" fullWidth onPress={handleSubmit(onSubmit)} loading={isSubmitting || save.isPending} haptic="medium" />
        </View>
      </Surface>
    </Screen>
  );
}
