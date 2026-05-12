// Subtle depth via elevation tokens — not heavy drop shadows.
// Platform-correct: iOS uses shadow* props, Android uses elevation.
import { Platform } from 'react-native';
import type { ViewStyle } from 'react-native';

type ElevationKey = 'none' | 'low' | 'medium' | 'high' | 'overlay';

const buildElevation = (
  level: number,
  shadowOpacity: number,
  shadowRadius: number,
  shadowOffsetY: number,
): ViewStyle =>
  Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOpacity,
      shadowRadius,
      shadowOffset: { width: 0, height: shadowOffsetY },
    },
    android: { elevation: level },
    default: {},
  }) as ViewStyle;

export const elevation: Record<ElevationKey, ViewStyle> = {
  none: {},
  low: buildElevation(2, 0.08, 4, 1),
  medium: buildElevation(6, 0.12, 10, 4),
  high: buildElevation(12, 0.18, 18, 8),
  overlay: buildElevation(20, 0.28, 28, 12),
};

export type { ElevationKey };
