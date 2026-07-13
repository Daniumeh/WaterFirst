import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { formatHydrationAmount, type HydrationUnit } from '@/src/features/hydration/units';
import { colors, glassShadow, radius, spacing, type, typography } from '@/src/theme/tokens';

import { DashboardIcon, dashboardIcons } from './DashboardIcon';
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
  const isCompactPhone = Math.min(width, 430) <= 360;

  return (
    <Card mode="contained" style={styles.card}>
      <View style={styles.heroGlow} />
      <Card.Content style={styles.content}>
        <View style={[styles.topRow, isCompactPhone && styles.topRowCompact]}>
          <View style={styles.progressLabelRow}>
            <View style={styles.iconBubble}>
              <DashboardIcon name={dashboardIcons.droplet} size={18} color={colors.cyan} />
            </View>
            <View>
              <Text style={styles.eyebrow}>Today Progress</Text>
              <Text style={styles.title}>{isFull ? 'Goal Completed' : "Today's hydration"}</Text>
            </View>
          </View>
          <UnitSwitcher unit={unit} onChange={onUnitChange} />
        </View>

        <View style={[styles.heroRow, isCompactPhone && styles.heroRowCompact]}>
          <View style={[styles.metricColumn, isCompactPhone && styles.metricColumnCompact]}>
            <Text style={styles.percent}>
              {percentComplete}
              <Text style={styles.percentSymbol}>%</Text>
            </Text>
            <View style={styles.amountStack}>
              <Text style={styles.amountLabel}>Consumed</Text>
              <Text style={styles.amountLine}>
                <Text style={styles.amountHighlight}>{formatHydrationAmount(consumedMl, unit)}</Text>
                <Text style={styles.amountDivider}> / {formatHydrationAmount(targetMl, unit)}</Text>
              </Text>
              <Text style={styles.dailyGoal}>Daily goal</Text>
            </View>
            <View style={[styles.statusBadge, isFull && styles.statusBadgeFull]}>
              <View style={[styles.statusDot, isFull && styles.statusDotFull]} />
              <Text style={[styles.statusText, isFull && styles.statusTextFull]}>
                {isFull ? 'Fully Replenished' : 'On track'}
              </Text>
            </View>
          </View>

          <View style={[styles.ringColumn, isCompactPhone && styles.ringColumnCompact]}>
            <KidneyProgressRing progress={progress} size={isCompactPhone ? 'compactHero' : 'hero'} />
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
    right: -80,
    top: -64,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(32, 199, 255, 0.13)',
  },
  content: {
    gap: spacing.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  topRowCompact: {
    alignItems: 'flex-start',
  },
  progressLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  iconBubble: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderColor: colors.line,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(32, 199, 255, 0.1)',
  },
  heroRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.lg,
  },
  heroRowCompact: {
    alignItems: 'stretch',
    flexBasis: 'auto',
    flexDirection: 'column',
    flexGrow: 0,
    flexShrink: 0,
  },
  title: {
    color: colors.text,
    ...typography.h1,
  },
  eyebrow: {
    color: colors.cyanSoft,
    ...typography.h2,
    letterSpacing: 0,
  },
  metricColumn: {
    flex: 0.9,
    gap: spacing.md,
  },
  metricColumnCompact: {
    flexBasis: 'auto',
    flexGrow: 0,
    flexShrink: 0,
  },
  percent: {
    color: colors.text,
    fontFamily: type.display,
    fontSize: 58,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 64,
  },
  percentSymbol: {
    color: colors.cyan,
    fontSize: 25,
    fontWeight: '700',
  },
  amountStack: {
    gap: spacing.xs,
  },
  amountLabel: {
    color: colors.muted,
    ...typography.h2,
  },
  amountLine: {
    color: colors.text,
    ...typography.h1,
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
  },
  statusBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: 'rgba(32, 199, 255, 0.1)',
  },
  statusBadgeFull: {
    backgroundColor: 'rgba(52, 232, 154, 0.12)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.cyan,
  },
  statusDotFull: {
    backgroundColor: colors.green,
  },
  statusText: {
    color: colors.cyanSoft,
    ...typography.h2,
  },
  statusTextFull: {
    color: colors.green,
  },
  ringColumn: {
    alignItems: 'center',
    flex: 1.15,
  },
  ringColumnCompact: {
    flexBasis: 'auto',
    flexGrow: 0,
    flexShrink: 0,
  },
  remainingText: {
    color: colors.muted,
    ...typography.body2,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
