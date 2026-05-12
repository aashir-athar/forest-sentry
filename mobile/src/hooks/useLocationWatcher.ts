// Subscribes to GPS once and reports inside-zone presence.
import { useZones } from '@/src/features/zones/useZones';
import { errorReporter } from '@/src/lib/errorReporter';
import { pointInPolygon } from '@/src/lib/geo';
import { useLocationStore } from '@/src/stores/useLocationStore';
import * as Location from 'expo-location';
import { useEffect } from 'react';

export function useLocationWatcher(enabled = true) {
  const setCurrent = useLocationStore((s) => s.setCurrent);
  const setInsideZone = useLocationStore((s) => s.setInsideZone);
  const { data: zones } = useZones();

  useEffect(() => {
    if (!enabled) return;
    let sub: Location.LocationSubscription | null = null;
    let active = true;

    void (async () => {
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.status !== 'granted') return;
        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 8, timeInterval: 6000 },
          (loc) => {
            if (!active) return;
            const cur = {
              lat: loc.coords.latitude,
              lng: loc.coords.longitude,
              accuracyM: loc.coords.accuracy ?? undefined,
              recordedAt: new Date(loc.timestamp).toISOString(),
            };
            setCurrent(cur);
            const z = (zones ?? []).find((z) => pointInPolygon(cur, z.boundary));
            setInsideZone(z?.id ?? null);
          },
        );
      } catch (error) {
        errorReporter.capture(error);
      }
    })();

    return () => {
      active = false;
      sub?.remove();
    };
  }, [enabled, zones, setCurrent, setInsideZone]);
}
