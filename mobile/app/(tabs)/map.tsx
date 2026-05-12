// Map — protected zones, tree markers, current position. Tap a tree to drill in.
// Lever: Gestalt common region — zones as colored fills group trees visually.
import { Button } from '@/src/components/Button';
import { HeaderBar } from '@/src/components/HeaderBar';
import { Icon } from '@/src/components/Icon';
import { Screen } from '@/src/components/Screen';
import { Surface } from '@/src/components/Surface';
import { Text } from '@/src/components/Text';
import type { HealthLabel } from '@/src/features/trees/types';
import { useTrees } from '@/src/features/trees/useTrees';
import { useZones } from '@/src/features/zones/useZones';
import { polygonCentroid } from '@/src/lib/geo';
import { useLocationStore } from '@/src/stores/useLocationStore';
import { useColors } from '@/src/theme/ThemeProvider';
import { spacing } from '@/src/theme/spacing';
import { useRouter } from 'expo-router';
import React, { useMemo, useRef } from 'react';
import { Platform, View } from 'react-native';
import MapView, { Marker, Polygon, type MapType } from 'react-native-maps';

const HEALTH_HEX: Record<HealthLabel, string> = {
  healthy: '#2A9968',
  stressed: '#D89500',
  diseased: '#D43838',
  pest: '#A85A05',
};

export default function MapTab() {
  const router = useRouter();
  const colors = useColors();
  const trees = useTrees();
  const zones = useZones();
  const current = useLocationStore((s) => s.current);
  const mapRef = useRef<MapView | null>(null);

  const initialRegion = useMemo(() => {
    const z = zones.data?.[0];
    if (z) {
      const c = polygonCentroid(z.boundary);
      return { latitude: c.lat, longitude: c.lng, latitudeDelta: 0.03, longitudeDelta: 0.03 };
    }
    return { latitude: 34.0762, longitude: 73.3953, latitudeDelta: 0.04, longitudeDelta: 0.04 };
  }, [zones.data]);

  const mapType: MapType = Platform.OS === 'ios' ? 'hybrid' : 'hybrid';

  return (
    <Screen edges={['top']} padded={false} scroll={false}>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <HeaderBar
          title="Map"
          subtitle={zones.data ? `${zones.data.length} zone${zones.data.length === 1 ? '' : 's'} • ${trees.data?.length ?? 0} trees` : ''}
          rightIcon="locate"
          onRightPress={() => {
            if (current) {
              mapRef.current?.animateToRegion({
                latitude: current.lat,
                longitude: current.lng,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              });
            }
          }}
          rightAccessibilityLabel="Center on me"
        />
      </View>

      <View style={{ flex: 1, marginHorizontal: spacing.lg, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={initialRegion}
          mapType={mapType}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass
          rotateEnabled
        >
          {(zones.data ?? []).map((z) => {
            const centroid = polygonCentroid(z.boundary);
            return (
              <React.Fragment key={z.id}>
                <Polygon
                  coordinates={z.boundary.map((p) => ({ latitude: p.lat, longitude: p.lng }))}
                  fillColor={colors.mapZoneFill}
                  strokeColor={colors.mapZoneStroke}
                  strokeWidth={2}
                />
                <Marker
                  coordinate={{ latitude: centroid.lat, longitude: centroid.lng }}
                  title={z.name}
                  description={z.protectionLevel === 'core' ? 'Core protected zone' : z.protectionLevel === 'restricted' ? 'Restricted zone' : 'Monitored zone'}
                  anchor={{ x: 0.5, y: 0.5 }}
                  image={require('../../assets/images/zone-marker.png')}
                  tracksViewChanges={false}
                />
              </React.Fragment>
            );
          })}
          {(trees.data ?? []).map((t) => (
            <Marker
              key={t.id}
              coordinate={{ latitude: t.lat, longitude: t.lng }}
              title={t.species}
              description={t.lastHealthLabel ?? 'no inspection yet'}
              pinColor={t.lastHealthLabel ? HEALTH_HEX[t.lastHealthLabel] : '#5A7F4A'}
              onCalloutPress={() => router.push({ pathname: '/tree-detail', params: { id: t.id } })}
            />
          ))}
        </MapView>
      </View>

      <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
        <Surface variant="glass" radius="xl" padded depth="medium">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Icon name="leaf" tone="accent" />
            <View style={{ flex: 1 }}>
              <Text variant="titleSM">Drop a zone</Text>
              <Text variant="bodySM" tone="secondary">
                Sketch a new protected boundary by tapping points on the map.
              </Text>
            </View>
            <Button label="Start" size="md" onPress={() => router.push('/zone-edit')} />
          </View>
        </Surface>
      </View>
    </Screen>
  );
}
