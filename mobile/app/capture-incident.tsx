// Incident report — severity ladder, photo, GPS-stamped, queues offline.
// Lever: cost-of-inaction made concrete — copy reminds the user that the record protects the prosecution.
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { HeaderBar } from '@/src/components/HeaderBar';
import { Icon } from '@/src/components/Icon';
import { Input } from '@/src/components/Input';
import { Pill } from '@/src/components/Pill';
import { Screen } from '@/src/components/Screen';
import { Text } from '@/src/components/Text';
import { useToast } from '@/src/components/Toast';
import type { IncidentSeverity } from '@/src/features/incidents/types';
import { useReportIncident } from '@/src/features/incidents/useIncidents';
import { useZones } from '@/src/features/zones/useZones';
import { useCapturePhoto } from '@/src/hooks/useCapturePhoto';
import { formatLatLng } from '@/src/lib/format';
import { pointInPolygon } from '@/src/lib/geo';
import { incidentFormSchema, type IncidentFormValues } from '@/src/schemas/incident';
import { useLocationStore } from '@/src/stores/useLocationStore';
import { spacing } from '@/src/theme/spacing';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';

const SEVERITY: { key: IncidentSeverity; label: string; helper: string }[] = [
  { key: 'observation', label: 'Observation', helper: 'No action; flag for later.' },
  { key: 'minor', label: 'Minor', helper: 'Single tree cut; no equipment.' },
  { key: 'serious', label: 'Serious', helper: 'Multiple trees or active logging.' },
  { key: 'critical', label: 'Critical', helper: 'Armed actors or large-scale operation.' },
];

export default function CaptureIncidentScreen() {
  const router = useRouter();
  const { show } = useToast();
  const { captureFromCamera } = useCapturePhoto();
  const report = useReportIncident();
  const zones = useZones();
  const liveLoc = useLocationStore((s) => s.current);

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    liveLoc ? { lat: liveLoc.lat, lng: liveLoc.lng } : null,
  );
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentFormSchema),
    defaultValues: { severity: 'minor', notes: '' },
  });

  const severity = watch('severity');
  const insideZone = coords ? (zones.data ?? []).find((z) => pointInPolygon(coords, z.boundary)) ?? null : null;

  useEffect(() => {
    if (coords) return;
    void (async () => {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      }
    })();
  }, [coords]);

  const onSubmit = async (values: IncidentFormValues) => {
    if (!coords) {
      show({ title: 'Need GPS to file the incident', tone: 'warn' });
      return;
    }
    try {
      await report.mutateAsync({
        severity: values.severity,
        lat: coords.lat,
        lng: coords.lng,
        insideZoneId: insideZone?.id,
        notes: values.notes,
        photoUri: photoUri ?? undefined,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      show({
        title: 'Incident filed',
        body: insideZone ? `Logged inside ${insideZone.name}. Authorities can be notified once you sync.` : 'Saved locally. Syncs when signal returns.',
        tone: 'success',
        image: require('../assets/images/success-saved.png'),
      });
      router.back();
    } catch (error) {
      show({ title: "Couldn't save the report", body: error instanceof Error ? error.message : 'Retry in a moment.', tone: 'danger' });
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <HeaderBar title="Report an incident" subtitle="The record is the case. Be specific." showBack />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ gap: spacing.lg }}>
          <View style={{ alignItems: 'center', paddingTop: spacing.sm }}>
            <Image
              source={require('../assets/images/alert-incident.png')}
              style={{ width: 112, height: 112 }}
              contentFit="contain"
              transition={180}
              accessibilityLabel="Illegal-logging alert glyph"
            />
          </View>
          <Card overline="Position">
            {coords ? (
              <View style={{ gap: spacing.xs }}>
                <Text variant="monoLG">{formatLatLng(coords.lat, coords.lng)}</Text>
                {insideZone ? (
                  <Badge label={`Inside ${insideZone.name}`} tone="alert" />
                ) : (
                  <Badge label="Outside zones" tone="neutral" />
                )}
              </View>
            ) : (
              <Text variant="bodyMD" tone="secondary">
                GPS is locking on — give it a moment.
              </Text>
            )}
          </Card>

          <View style={{ gap: spacing.sm }}>
            <Text variant="overline" tone="tertiary">
              SEVERITY
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
              {SEVERITY.map((s) => (
                <Pill key={s.key} label={s.label} selected={severity === s.key} onPress={() => setValue('severity', s.key, { shouldDirty: true })} />
              ))}
            </View>
            <Text variant="caption" tone="tertiary">
              {SEVERITY.find((s) => s.key === severity)?.helper}
            </Text>
          </View>

          <Controller
            control={control}
            name="notes"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="What did you see?"
                placeholder="How many people, what kind of tools, direction of travel..."
                multiline
                numberOfLines={4}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.notes?.message}
              />
            )}
          />

          <Card overline="Evidence" title="Photo (recommended)" subtitle="Even a blurred shot of equipment helps an investigation.">
            {photoUri ? (
              <Pressable onPress={async () => { const uri = await captureFromCamera(); if (uri) setPhotoUri(uri); }} accessibilityRole="button" accessibilityLabel="Replace photo">
                <Image source={{ uri: photoUri }} style={{ width: '100%', height: 200, borderRadius: 12 }} contentFit="cover" />
              </Pressable>
            ) : (
              <Button label="Take a photo" variant="ghost" iconLeading={<Icon name="camera" size={16} />} onPress={async () => { const uri = await captureFromCamera(); if (uri) setPhotoUri(uri); }} />
            )}
          </Card>

          <Button label="File this incident" variant="alert" size="xl" fullWidth onPress={handleSubmit(onSubmit)} loading={isSubmitting || report.isPending} haptic="medium" />

          <Text variant="caption" tone="tertiary" align="center">
            Filing offline is fine. The record is signed by your device, with GPS and time.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
