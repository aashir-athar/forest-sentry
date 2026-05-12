// Capture a tree — single-form, GPS auto-captured, photo optional.
// Lever: peak-end rule — satisfying success state on save; haptic + toast + return.
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { HeaderBar } from '@/src/components/HeaderBar';
import { Icon } from '@/src/components/Icon';
import { Input } from '@/src/components/Input';
import { Screen } from '@/src/components/Screen';
import { Skeleton } from '@/src/components/Skeleton';
import { Text } from '@/src/components/Text';
import { useToast } from '@/src/components/Toast';
import { useCreateTree } from '@/src/features/trees/useTrees';
import { useZones } from '@/src/features/zones/useZones';
import { useCapturePhoto } from '@/src/hooks/useCapturePhoto';
import { formatLatLng } from '@/src/lib/format';
import { pointInPolygon } from '@/src/lib/geo';
import { treeFormSchema, type TreeFormInput, type TreeFormValues } from '@/src/schemas/tree';
import { useLocationStore } from '@/src/stores/useLocationStore';
import { spacing } from '@/src/theme/spacing';
import { useColors } from '@/src/theme/ThemeProvider';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

export default function CaptureTreeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { show } = useToast();
  const { captureFromCamera, pickFromLibrary } = useCapturePhoto();
  const create = useCreateTree();
  const zones = useZones();
  const liveLoc = useLocationStore((s) => s.current);

  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracyM?: number } | null>(
    liveLoc ? { lat: liveLoc.lat, lng: liveLoc.lng, accuracyM: liveLoc.accuracyM } : null,
  );
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [locking, setLocking] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<TreeFormInput, unknown, TreeFormValues>({
    resolver: zodResolver(treeFormSchema),
    defaultValues: { species: '', notes: '' },
  });

  const insideZone = coords ? (zones.data ?? []).find((z) => pointInPolygon(coords, z.boundary)) ?? null : null;

  useEffect(() => {
    if (coords || locking) return;
    setLocking(true);
    void (async () => {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude, accuracyM: loc.coords.accuracy ?? undefined });
      }
      setLocking(false);
    })();
  }, [coords, locking]);

  const refreshCoords = async () => {
    setLocking(true);
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude, accuracyM: loc.coords.accuracy ?? undefined });
    } finally {
      setLocking(false);
    }
  };

  const onCamera = async () => {
    const uri = await captureFromCamera();
    if (uri) setPhotoUri(uri);
  };
  const onLibrary = async () => {
    const uri = await pickFromLibrary();
    if (uri) setPhotoUri(uri);
  };

  const onSubmit = async (values: TreeFormValues) => {
    if (!coords) {
      show({ title: 'Need a GPS lock first', body: 'Tap "Refresh location" once you reach the tree.', tone: 'warn' });
      return;
    }
    try {
      const record = await create.mutateAsync({
        species: values.species,
        lat: coords.lat,
        lng: coords.lng,
        girthCm: values.girthCm,
        heightM: values.heightM,
        notes: values.notes,
        photoUri: photoUri ?? undefined,
        zoneId: insideZone?.id,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      show({
        title: 'Tagged. Saved.',
        body: 'It is on the device and will sync the moment you are online.',
        tone: 'success',
        image: require('../assets/images/success-saved.png'),
      });
      router.replace({ pathname: '/tree-detail', params: { id: record.id } });
    } catch (error) {
      show({ title: "Couldn't save that tree", body: error instanceof Error ? error.message : 'Try again in a second.', tone: 'danger' });
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <HeaderBar title="Tag a tree" subtitle="GPS auto-captures. Photo optional." showBack />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ gap: spacing.lg }}>
          <Card overline="Location">
            {locking && !coords ? (
              <Skeleton height={28} />
            ) : coords ? (
              <View style={{ gap: spacing.xs }}>
                <Text variant="monoLG">{formatLatLng(coords.lat, coords.lng)}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
                  {coords.accuracyM != null && (
                    <Text variant="bodySM" tone="tertiary">
                      ±{coords.accuracyM.toFixed(1)} m
                    </Text>
                  )}
                  {insideZone ? (
                    <Badge label={`Inside ${insideZone.name}`} tone="success" />
                  ) : (
                    <Badge label="Outside zones" tone="neutral" />
                  )}
                </View>
              </View>
            ) : (
              <Text variant="bodyMD" tone="secondary">
                Waiting for a GPS lock — keep the device steady for a few seconds.
              </Text>
            )}
            <View style={{ marginTop: spacing.sm }}>
              <Button label="Refresh location" variant="ghost" size="sm" onPress={refreshCoords} loading={locking} />
            </View>
          </Card>

          <Controller
            control={control}
            name="species"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Species"
                placeholder="Blue pine, deodar, silver fir..."
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.species?.message}
              />
            )}
          />

          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="girthCm"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="Girth (cm)"
                    placeholder="142"
                    keyboardType="decimal-pad"
                    value={value?.toString() ?? ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.girthCm?.message}
                    variant="mono"
                  />
                )}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="heightM"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="Height (m)"
                    placeholder="28.5"
                    keyboardType="decimal-pad"
                    value={value?.toString() ?? ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.heightM?.message}
                    variant="mono"
                  />
                )}
              />
            </View>
          </View>

          <Controller
            control={control}
            name="notes"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Notes"
                placeholder="What does the tree look like? Anything off?"
                multiline
                numberOfLines={3}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.notes?.message}
              />
            )}
          />

          <Card overline="Photo" title="Field reference (optional)" subtitle="Helpful for re-identification on the next inspection.">
            {photoUri ? (
              <Animated.View entering={FadeIn}>
                <Pressable onPress={onCamera} accessibilityRole="button" accessibilityLabel="Replace photo">
                  <Image source={{ uri: photoUri }} style={{ width: '100%', height: 200, borderRadius: 12 }} contentFit="cover" />
                </Pressable>
              </Animated.View>
            ) : (
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Button label="Use camera" variant="ghost" size="md" iconLeading={<Icon name="camera" size={16} />} onPress={onCamera} />
                <Button label="Pick from library" variant="ghost" size="md" iconLeading={<Icon name="images" size={16} />} onPress={onLibrary} />
              </View>
            )}
          </Card>

          <Animated.View entering={FadeInDown.delay(80)}>
            <Button label="Save tree" size="xl" fullWidth onPress={handleSubmit(onSubmit)} loading={isSubmitting || create.isPending} haptic="medium" />
          </Animated.View>

          <Text variant="caption" tone="tertiary" align="center">
            Saves on the device. Syncs when you have signal — no losing work in a cold valley.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
