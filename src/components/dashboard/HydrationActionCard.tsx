import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { getDeviceNow, getLocalMinutes } from '@/src/features/hydration/deviceTime';
import { formatHydrationAmount, type HydrationUnit } from '@/src/features/hydration/units';
import type { HydrationCheckpoint } from '@/src/features/hydration/types';
import { colors, glassShadow, radius, spacing, type } from '@/src/theme/tokens';

type HydrationActionCardProps = {
  checkpoint: HydrationCheckpoint | null;
  consumedMl: number;
  now?: Date;
  unit: HydrationUnit;
};

export function HydrationActionCard({
  checkpoint,
  consumedMl,
  now = getDeviceNow(),
  unit,
}: HydrationActionCardProps) {
  const currentMinutes = getLocalMinutes(now);
  const isMissed = checkpoint ? checkpoint.dueMinutes < currentMinutes && consumedMl < checkpoint.targetMl : false;
  const amountDueMl = checkpoint ? Math.max(checkpoint.targetMl - consumedMl, 0) : 0;
  const minutesUntilDue = checkpoint
    ? Math.max(checkpoint.dueMinutes - currentMinutes, 0)
    : 0;

  return (
    <Card mode="contained" style={[styles.card, isMissed && styles.missedCard]}>
      <Card.Content style={styles.content}>
        <View style={styles.titleRow}>
          <View style={styles.icon} />
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
                <View style={styles.drop} />
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
    minWidth: 180,
    backgroundColor: colors.glass,
    ...glassShadow,
  },
  missedCard: {
    borderColor: colors.orange,
    backgroundColor: 'rgba(55, 31, 19, 0.92)',
  },
  content: {
    gap: spacing.md,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  icon: {
    width: 18,
    height: 18,
    borderColor: colors.cyan,
    borderRadius: 9,
    borderWidth: 2,
    borderLeftColor: 'transparent',
  },
  kicker: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  cardBody: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    fontFamily: type.data,
    fontSize: 20,
    fontWeight: '900',
  },
  dropRing: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 88,
    height: 88,
    flexShrink: 0,
    borderColor: colors.line,
    borderRadius: 44,
    borderWidth: 6,
    backgroundColor: 'rgba(3, 16, 28, 0.74)',
  },
  drop: {
    width: 28,
    height: 40,
    borderColor: colors.cyan,
    borderRadius: 16,
    borderWidth: 3,
    backgroundColor: 'rgba(32, 199, 255, 0.22)',
  },
  message: {
    borderColor: colors.line,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.muted,
    lineHeight: 21,
    padding: spacing.sm,
    backgroundColor: 'rgba(3, 16, 28, 0.46)',
  },
});
