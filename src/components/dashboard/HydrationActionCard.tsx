import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { formatHydrationAmount, type HydrationUnit } from '@/src/features/hydration/units';
import type { HydrationCheckpoint } from '@/src/features/hydration/types';
import { colors, radius, spacing } from '@/src/theme/tokens';

type HydrationActionCardProps = {
  checkpoint: HydrationCheckpoint | null;
  consumedMl: number;
  unit: HydrationUnit;
};

export function HydrationActionCard({ checkpoint, consumedMl, unit }: HydrationActionCardProps) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isMissed = checkpoint ? checkpoint.dueMinutes < currentMinutes && consumedMl < checkpoint.targetMl : false;
  const amountDueMl = checkpoint ? Math.max(checkpoint.targetMl - consumedMl, 0) : 0;
  const minutesUntilDue = checkpoint
    ? Math.max(checkpoint.dueMinutes - currentMinutes, 0)
    : 0;

  return (
    <Card mode="contained" style={[styles.card, isMissed && styles.missedCard]}>
      <Card.Content style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>◷</Text>
          <Text style={styles.kicker}>{isMissed ? 'Missed Hydration' : 'Next Hydration'}</Text>
        </View>
        {checkpoint ? (
          <>
            <View style={styles.cardBody}>
              <View style={styles.metricColumn}>
                <Metric label="Next Drink" value={formatHydrationAmount(amountDueMl || 500, unit)} />
                <Metric
                  label={isMissed ? 'Was Due' : 'Due in'}
                  value={isMissed ? checkpoint.timeLabel : `${minutesUntilDue} min`}
                />
              </View>
              <View style={styles.dropRing}>
                <Text style={styles.drop}>♢</Text>
              </View>
            </View>
            <Text style={styles.message}>
              {isMissed
                ? `You were supposed to drink ${formatHydrationAmount(amountDueMl || 500, unit)} at ${checkpoint.timeLabel}. Drink now to stay on track.`
                : `Your next checkpoint is ${formatHydrationAmount(checkpoint.targetMl, unit)} by ${checkpoint.timeLabel}.`}
            </Text>
          </>
        ) : (
          <Text style={styles.message}>Your checkpoints are complete. Keep the streak alive tomorrow.</Text>
        )}
      </Card.Content>
    </Card>
  );
}

type MetricProps = {
  label: string;
  value: string;
};

function Metric({ label, value }: MetricProps) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue} variant="titleLarge">
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderColor: colors.cyan,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: '#06243A',
  },
  missedCard: {
    borderColor: colors.orange,
    backgroundColor: '#261C18',
  },
  content: {
    gap: spacing.md,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  icon: {
    color: colors.cyan,
    fontSize: 22,
  },
  kicker: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  cardBody: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  metricColumn: {
    flex: 1,
    gap: spacing.sm,
  },
  metric: {
    borderRadius: radius.md,
    backgroundColor: 'transparent',
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
  },
  metricValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  dropRing: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 88,
    height: 88,
    borderColor: colors.cyan,
    borderRadius: 44,
    borderWidth: 6,
    backgroundColor: colors.panel,
  },
  drop: {
    color: colors.cyan,
    fontSize: 40,
    fontWeight: '900',
  },
  message: {
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.muted,
    lineHeight: 21,
    padding: spacing.sm,
    backgroundColor: colors.panel,
  },
});
