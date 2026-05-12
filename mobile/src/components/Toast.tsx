// Toast — non-blocking status nudge anchored above the home indicator.
// Variants: success, warn, danger, info, neutral. Auto-dismiss; undo callback optional.
import { useColors } from '@/src/theme/ThemeProvider';
import { spacing } from '@/src/theme/spacing';
import * as Haptics from 'expo-haptics';
import { Image, type ImageSource } from 'expo-image';
import React, { createContext, useCallback, useContext, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutDown,
  Layout,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from './Icon';
import { Surface } from './Surface';
import { Text } from './Text';

export type ToastTone = 'success' | 'warn' | 'danger' | 'info' | 'neutral';

export type ToastInput = {
  title: string;
  body?: string;
  tone?: ToastTone;
  // Optional brand glyph (PNG asset via require). Replaces the tone icon when present.
  image?: number | ImageSource;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
};

type InternalToast = ToastInput & { id: string };

type ToastContextValue = {
  show: (t: ToastInput) => void;
};

const ToastCtx = createContext<ToastContextValue | null>(null);

const toneIcon: Record<ToastTone, IconName> = {
  success: 'checkmark-circle',
  warn: 'alert-circle',
  danger: 'close-circle',
  info: 'information-circle',
  neutral: 'ellipse',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const [stack, setStack] = useState<InternalToast[]>([]);

  const dismiss = useCallback((id: string) => {
    setStack((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (t: ToastInput) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setStack((prev) => [...prev.slice(-2), { ...t, id }]);
      if (t.tone === 'success') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else if (t.tone === 'danger') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      else if (t.tone === 'warn') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      const dur = t.durationMs ?? 3200;
      setTimeout(() => dismiss(id), dur);
    },
    [dismiss],
  );

  const value: ToastContextValue = { show };

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          left: spacing.lg,
          right: spacing.lg,
          bottom: insets.bottom + spacing.lg,
          gap: spacing.sm,
        }}
      >
        {stack.map((t) => (
          <Animated.View
            key={t.id}
            entering={FadeInDown.duration(220)}
            exiting={FadeOutDown.duration(180)}
            layout={Layout.springify()}
          >
            <Surface variant="glass" depth="medium" padded radius="lg">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                {t.image ? (
                  <Image source={t.image} style={{ width: 40, height: 40 }} contentFit="contain" />
                ) : (
                  <Icon name={toneIcon[t.tone ?? 'neutral']} tone={t.tone === 'neutral' ? 'primary' : (t.tone ?? 'primary')} />
                )}
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="titleSM">{t.title}</Text>
                  {t.body ? (
                    <Text variant="bodySM" tone="secondary">
                      {t.body}
                    </Text>
                  ) : null}
                </View>
                {t.actionLabel ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t.actionLabel}
                    onPress={() => {
                      t.onAction?.();
                      dismiss(t.id);
                    }}
                    style={{ paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }}
                  >
                    <Text variant="labelMD" style={{ color: colors.accent }}>
                      {t.actionLabel}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </Surface>
          </Animated.View>
        ))}
      </View>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
