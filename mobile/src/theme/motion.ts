// Motion-as-language tokens — duration, easing, springs.
// Worklets-friendly numbers; respect useReducedMotion in components.
import { Easing } from 'react-native-reanimated';

export const duration = {
  instant: 80,
  micro: 140,
  fast: 200,
  base: 280,
  slow: 420,
  langorous: 640,
} as const;

export const easing = {
  standard: Easing.bezier(0.2, 0.0, 0.0, 1.0),
  emphasized: Easing.bezier(0.2, 0.0, 0.0, 1.0),
  emphasizedDecel: Easing.bezier(0.05, 0.7, 0.1, 1.0),
  emphasizedAccel: Easing.bezier(0.3, 0.0, 0.8, 0.15),
  linear: Easing.linear,
};

export const springs = {
  tap: { mass: 0.6, stiffness: 380, damping: 26 },
  gentle: { mass: 1.0, stiffness: 180, damping: 22 },
  bouncy: { mass: 1.0, stiffness: 260, damping: 14 },
} as const;
