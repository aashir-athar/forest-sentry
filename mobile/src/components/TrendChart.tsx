// TrendChart — Skia-backed sparkline with projected segment dashed.
// Variants: full (axis labels) and compact.
import type { TimeSeriesPoint } from '@/src/lib/projection';
import { spacing } from '@/src/theme/spacing';
import { useColors } from '@/src/theme/ThemeProvider';
import { Canvas, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Text } from './Text';

export type TrendChartProps = {
  history: TimeSeriesPoint[];
  projection: TimeSeriesPoint[];
  width: number;
  height: number;
  showAxis?: boolean;
};

export const TrendChart = React.memo(function TrendChart({
  history,
  projection,
  width,
  height,
  showAxis = true,
}: TrendChartProps) {
  const colors = useColors();
  const padX = 16;
  const padY = 18;

  const { paths, ticks } = useMemo(() => {
    const all = [...history, ...projection];
    if (all.length === 0) return { paths: null, ticks: [] as { x: number; y: number; label: string }[] };
    const minT = Math.min(...all.map((p) => p.t));
    const maxT = Math.max(...all.map((p) => p.t));
    const span = Math.max(1, maxT - minT);

    const xs = (t: number) => padX + ((t - minT) / span) * (width - padX * 2);
    const ys = (v: number) => height - padY - v * (height - padY * 2);

    const hist = Skia.Path.Make();
    history.forEach((p, i) => {
      const x = xs(p.t);
      const y = ys(p.v);
      if (i === 0) hist.moveTo(x, y);
      else hist.lineTo(x, y);
    });

    const proj = Skia.Path.Make();
    if (projection.length > 0 && history.length > 0) {
      const last = history[history.length - 1]!;
      proj.moveTo(xs(last.t), ys(last.v));
      projection.forEach((p) => proj.lineTo(xs(p.t), ys(p.v)));
    }

    const fill = Skia.Path.Make();
    if (history.length > 0) {
      fill.moveTo(xs(history[0]!.t), height - padY);
      history.forEach((p) => fill.lineTo(xs(p.t), ys(p.v)));
      fill.lineTo(xs(history[history.length - 1]!.t), height - padY);
      fill.close();
    }

    const ticks: { x: number; y: number; label: string }[] = [];
    if (history[0]) ticks.push({ x: xs(history[0].t), y: height - 4, label: new Date(history[0].t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) });
    if (history[history.length - 1]) {
      const last = history[history.length - 1]!;
      ticks.push({ x: xs(last.t), y: height - 4, label: 'now' });
    }
    if (projection[projection.length - 1]) {
      const lastP = projection[projection.length - 1]!;
      ticks.push({ x: xs(lastP.t), y: height - 4, label: '+forecast' });
    }

    return { paths: { hist, proj, fill }, ticks };
  }, [history, projection, width, height]);

  return (
    <View style={{ width, height }}>
      <Canvas style={{ width, height }}>
        {paths && (
          <>
            <Path path={paths.fill} style="fill">
              <LinearGradient start={vec(0, padY)} end={vec(0, height - padY)} colors={[colors.accent + '55', colors.accent + '00']} />
            </Path>
            <Path path={paths.hist} style="stroke" strokeWidth={2.5} color={colors.accent} />
            <Path path={paths.proj} style="stroke" strokeWidth={2} color={colors.alert} />
          </>
        )}
      </Canvas>
      {showAxis && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.sm, marginTop: -spacing.sm }}>
          {ticks.map((t, i) => (
            <Text key={i} variant="caption" tone="tertiary">
              {t.label}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
});
