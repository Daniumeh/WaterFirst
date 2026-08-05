import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { formatHydrationAmount, type HydrationUnit } from '@/src/features/hydration/units';
import { colors, glassShadow, radius, spacing, type, typography } from '@/src/theme/tokens';

import { KidneyProgressRing } from './KidneyProgressRing';
import { UnitSwitcher } from './UnitSwitcher';

type HydrationHeroCardProps = {
  consumedMl: number;
  targetMl: number;
  unit: HydrationUnit;
  onUnitChange: (unit: HydrationUnit) => void;
};

export function HydrationHeroCard({
  consumedMl,
  targetMl,
  unit,
  onUnitChange,
}: HydrationHeroCardProps) {
  const { width } = useWindowDimensions();
  const progress = Math.min(consumedMl / Math.max(targetMl, 1), 1);
  const percentComplete = Math.round(progress * 100);
  const isFull = percentComplete >= 100;
  const isMobilePhone = width <= 430;
  const isCompactPhone = width <= 360;
  const ringSize = width <= 360 ? 'compactHero' : 'hero';

  return (
    <Card mode="contained" style={styles.card}>
      <View style={styles.heroGlow} />
      <View style={styles.heroOrb} />
      <Card.Content
        style={[
          styles.content,
          isMobilePhone && styles.contentMobile,
          isCompactPhone && styles.contentCompact,
        ]}
      >
        <View style={styles.unitDock}>
          <UnitSwitcher unit={unit} onChange={onUnitChange} />
        </View>

        <View style={[styles.heroRow, isCompactPhone && styles.heroRowCompact]}>
          <View
            style={[
              styles.metricColumn,
              isMobilePhone && styles.metricColumnMobile,
              isCompactPhone && styles.metricColumnCompact,
            ]}
          >
            <Text
              style={[
                styles.percent,
                isMobilePhone && styles.percentMobile,
                isCompactPhone && styles.percentCompact,
              ]}
            >
              {percentComplete}
              <Text style={styles.percentSymbol}>%</Text>
            </Text>
            <View style={styles.amountStack}>
              <Text style={styles.amountLabel}>Consumed</Text>
              <Text style={[styles.amountLine, isMobilePhone && styles.amountLineMobile]}>
                <Text style={styles.amountHighlight}>{formatHydrationAmount(consumedMl, unit)}</Text>
                <Text style={styles.amountDivider}> / {formatHydrationAmount(targetMl, unit)}</Text>
              </Text>
              <Text style={styles.dailyGoal}>Daily goal</Text>
            </View>
            <View style={[styles.statusBadge, isFull && styles.statusBadgeFull]}>
              <View style={[styles.statusDot, isFull && styles.statusDotFull]} />
              <Text style={[styles.statusText, isFull && styles.statusTextFull]}>
                {isFull ? 'Full' : 'On track'}
              </Text>
            </View>
          </View>

          <View style={[styles.ringColumn, isCompactPhone && styles.ringColumnCompact]}>
            <KidneyProgressRing progress={progress} size={ringSize} />
            <Text style={styles.remainingText}>
              {isFull
                ? 'Goal Completed Today'
                : `${formatHydrationAmount(Math.max(targetMl - consumedMl, 0), unit)} more to go`}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: colors.line,
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(5, 24, 39, 0.96)',
    ...glassShadow,
  },
  heroGlow: {
    position: 'absolute',
    right: -92,
    top: -84,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(32, 199, 255, 0.15)',
  },
  heroOrb: {
    position: 'absolute',
    right: -26,
    top: 10,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(32, 199, 255, 0.035)',
  },
  content: {
    minHeight: 250,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.lg,
  },
  contentMobile: {
    minHeight: 244,
    paddingHorizontal: 14,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
  },
  contentCompact: {
    minHeight: 228,
    paddingHorizontal: spacing.md,
  },
  unitDock: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    zIndex: 2,
  },
  heroRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    minHeight: 214,
  },
  heroRowCompact: {
    gap: spacing.xs,
  },
  metricColumn: {
    flex: 0.86,
    gap: spacing.md,
    minWidth: 112,
    paddingTop: spacing.md,
  },
  metricColumnMobile: {
    gap: spacing.sm,
    minWidth: 100,
  },
  metricColumnCompact: {
    minWidth: 88,
    paddingTop: spacing.sm,
  },
  percent: {
    color: colors.text,
    fontFamily: type.display,
    fontSize: 62,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 68,
  },
  percentSymbol: {
    color: colors.cyan,
    fontSize: 25,
    fontWeight: '700',
  },
  percentMobile: {
    fontSize: 56,
    lineHeight: 62,
  },
  percentCompact: {
    fontSize: 48,
    lineHeight: 54,
  },
  amountStack: {
    gap: spacing.xs,
  },
  amountLabel: {
    color: colors.muted,
    ...typography.h2,
    fontSize: 13,
    lineHeight: 18,
  },
  amountLine: {
    color: colors.text,
    ...typography.h1,
    fontSize: 18,
    lineHeight: 24,
  },
  amountLineMobile: {
    fontSize: 16,
    lineHeight: 22,
  },
  amountHighlight: {
    color: colors.cyan,
  },
  amountDivider: {
    color: colors.muted,
  },
  dailyGoal: {
    color: colors.muted,
    ...typography.body1,
    fontSize: 13,
  },
  statusBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(32, 199, 255, 0.13)',
  },
  statusBadgeFull: {
    backgroundColor: 'rgba(52, 232, 154, 0.12)',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.cyan,
  },
  statusDotFull: {
    backgroundColor: colors.green,
  },
  statusText: {
    color: colors.cyanSoft,
    ...typography.h2,
    fontSize: 14,
    lineHeight: 18,
  },
  statusTextFull: {
    color: colors.green,
  },
  ringColumn: {
    alignItems: 'center',
    flex: 1.42,
    justifyContent: 'center',
    paddingTop: spacing.lg,
  },
  ringColumnCompact: {
    paddingTop: spacing.md,
  },
  remainingText: {
    color: colors.muted,
    ...typography.body1,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
