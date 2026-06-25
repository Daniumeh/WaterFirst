import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { formatHydrationAmount, type HydrationUnit } from '@/src/features/hydration/units';
import { colors, radius, shadow, spacing } from '@/src/theme/tokens';

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
      <Card.Content style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.dropIcon}>♢</Text>
            <Text style={styles.title}>{isFull ? 'Full' : "Today's Progress"}</Text>
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
              <Text style={styles.statusText}>{isFull ? 'Fully Replenished' : 'On Track'}</Text>
              <Text style={styles.statusSubtext}>{isFull ? 'Goal Completed Today' : 'Keep it up!'}</Text>
            </View>
          </View>

          <View style={styles.ringColumn}>
            <KidneyProgressRing progress={progress} />
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
    ...shadow,
  },
  content: {
    gap: spacing.md,
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
    color: colors.cyan,
    fontSize: 24,
    fontWeight: '900',
  },
  heroRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  metricColumn: {
    flex: 0.9,
    gap: spacing.xs,
  },
  percent: {
    color: colors.text,
    fontWeight: '900',
  },
  percentSymbol: {
    color: colors.cyan,
    fontSize: 26,
    fontWeight: '900',
  },
  amountLine: {
    color: colors.muted,
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
    alignSelf: 'flex-start',
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(13, 38, 58, 0.78)',
  },
  statusText: {
    color: colors.green,
    fontSize: 16,
    fontWeight: '900',
  },
  statusSubtext: {
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
    marginTop: -spacing.sm,
    textAlign: 'center',
  },
});
