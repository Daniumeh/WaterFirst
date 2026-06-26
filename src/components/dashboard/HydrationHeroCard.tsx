import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { formatHydrationAmount, type HydrationUnit } from '@/src/features/hydration/units';
import { colors, glassShadow, radius, spacing, type } from '@/src/theme/tokens';

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
  const progress = Math.min(consumedMl / Math.max(targetMl, 1), 1);
  const percentComplete = Math.round(progress * 100);
  const isFull = percentComplete >= 100;

  return (
    <Card mode="contained" style={styles.card}>
      <View style={styles.capsuleRail} />
      <View style={styles.capsuleWash} />
      <Card.Content style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.progressLabelRow}>
            <View style={styles.dropIcon} />
            <View>
              <Text style={styles.eyebrow}>Hydration capsule</Text>
              <Text style={styles.title}>{isFull ? 'Full reservoir' : "Today's Progress"}</Text>
            </View>
          </View>
          <UnitSwitcher unit={unit} onChange={onUnitChange} />
        </View>

        <View style={styles.heroRow}>
          <View style={styles.metricColumn}>
            <Text style={styles.percent} variant="displayMedium">
              {percentComplete}
              <Text style={styles.percentSymbol}>%</Text>
            </Text>
            <Text style={styles.amountLine} variant="titleLarge">
              <Text style={styles.amountHighlight}>{formatHydrationAmount(consumedMl, unit)}</Text> /{' '}
              {formatHydrationAmount(targetMl, unit)}
            </Text>
            <Text style={styles.dailyGoal}>Daily Goal</Text>
            <View style={styles.statusBox}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{isFull ? 'Fully Replenished' : 'On Track'}</Text>
              <Text style={styles.statusSubtext}>{isFull ? 'Goal Completed Today' : 'Keep it up!'}</Text>
            </View>
          </View>

          <View style={styles.ringColumn}>
            <KidneyProgressRing progress={progress} />
            <View style={styles.meterTicks}>
              <View style={[styles.tick, percentComplete > 0 && styles.tickActive]} />
              <View style={[styles.tick, percentComplete >= 50 && styles.tickActive]} />
              <View style={[styles.tick, percentComplete >= 100 && styles.tickActive]} />
            </View>
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
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: colors.midnight,
    ...glassShadow,
  },
  capsuleRail: {
    position: 'absolute',
    left: -28,
    top: 28,
    width: 6,
    height: 188,
    borderRadius: 3,
    backgroundColor: colors.cyan,
    opacity: 0.7,
  },
  capsuleWash: {
    position: 'absolute',
    right: -56,
    bottom: -46,
    width: 190,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.wash,
    transform: [{ rotate: '-18deg' }],
  },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.lg,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dropIcon: {
    width: 13,
    height: 23,
    borderColor: colors.cyan,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: 'rgba(32, 199, 255, 0.16)',
  },
  heroRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  eyebrow: {
    color: colors.cyanSoft,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  metricColumn: {
    flex: 0.9,
    gap: spacing.xs,
  },
  percent: {
    color: colors.text,
    fontFamily: type.data,
    fontWeight: '900',
  },
  percentSymbol: {
    color: colors.cyan,
    fontSize: 26,
    fontWeight: '900',
  },
  amountLine: {
    color: colors.muted,
    fontFamily: type.data,
    fontWeight: '700',
  },
  amountHighlight: {
    color: colors.cyan,
    fontWeight: '900',
  },
  dailyGoal: {
    color: colors.muted,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  statusBox: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderColor: colors.line,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.glass,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  statusText: {
    color: colors.green,
    fontSize: 16,
    fontWeight: '900',
  },
  statusSubtext: {
    width: '100%',
    color: colors.text,
    marginTop: 2,
  },
  ringColumn: {
    alignItems: 'center',
    flex: 1.22,
  },
  remainingText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  meterTicks: {
    flexDirection: 'row',
    gap: 5,
    marginTop: -spacing.sm,
  },
  tick: {
    width: 18,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  tickActive: {
    backgroundColor: colors.cyan,
  },
});
