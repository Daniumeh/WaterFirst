import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { getDeviceNow, getLocalMinutes } from '@/src/features/hydration/deviceTime';
import type { HydrationCheckpoint } from '@/src/features/hydration/types';
import { formatHydrationAmount, type HydrationUnit } from '@/src/features/hydration/units';
import { colors, glassShadow, radius, spacing, typography } from '@/src/theme/tokens';

import { DashboardIcon, dashboardIcons } from './DashboardIcon';

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
  const minutesUntilDue = checkpoint ? Math.max(checkpoint.dueMinutes - currentMinutes, 0) : 0;
  const title = checkpoint
    ? isMissed
      ? 'Missed hydration checkpoint'
      : `Next hydration at ${checkpoint.timeLabel}`
    : 'All checkpoints complete';
  const message = checkpoint
    ? isMissed
      ? `Drink ${formatHydrationAmount(amountDueMl || 500, unit)} now to stay on track.`
      : `You've got this. ${formatHydrationAmount(amountDueMl || checkpoint.targetMl, unit)} due in ${minutesUntilDue} min.`
    : 'Keep the streak alive tomorrow.';

  return (
    <Card mode="contained" style={[styles.card, isMissed && styles.missedCard]}>
      <Card.Content style={styles.content}>
        <View style={styles.iconBubble}>
          <DashboardIcon
            name={isMissed ? dashboardIcons.reminder : dashboardIcons.bell}
            size={22}
            color={isMissed ? colors.orange : colors.cyan}
          />
        </View>
        <View style={styles.copy}>
          <Text style={styles.kicker}>Next hydration</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
        <View style={[styles.statusPill, isMissed && styles.statusPillMissed]}>
          <Text style={[styles.statusText, isMissed && styles.statusTextMissed]}>
            {checkpoint ? (isMissed ? 'Drink now' : 'Reminder on') : 'Complete'}
          </Text>
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
    backgroundColor: 'rgba(10, 36, 55, 0.68)',
    ...glassShadow,
  },
  missedCard: {
    borderColor: 'rgba(255, 178, 87, 0.38)',
    backgroundColor: 'rgba(46, 31, 19, 0.74)',
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    padding: spacing.lg,
  },
  iconBubble: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(32, 199, 255, 0.1)',
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 170,
  },
  kicker: {
    color: colors.muted,
    ...typography.h2,
  },
  title: {
    color: colors.text,
    ...typography.h1,
  },
  message: {
    color: colors.muted,
    ...typography.body1,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(32, 199, 255, 0.1)',
  },
  statusPillMissed: {
    backgroundColor: 'rgba(255, 178, 87, 0.14)',
  },
  statusText: {
    color: colors.cyanSoft,
    ...typography.h2,
  },
  statusTextMissed: {
    color: colors.orange,
  },
});
