import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import {
  getCheckpointStatus as getDeviceCheckpointStatus,
  getDeviceNow,
} from '@/src/features/hydration/deviceTime';
import type { HydrationCheckpoint } from '@/src/features/hydration/types';
import { formatHydrationAmount, type HydrationUnit } from '@/src/features/hydration/units';
import { colors, glassShadow, radius, spacing, typography } from '@/src/theme/tokens';

import { DashboardIcon, dashboardIcons } from './DashboardIcon';

type HydrationTimelineProps = {
  checkpoints: HydrationCheckpoint[];
  consumedMl: number;
  now?: Date;
  unit: HydrationUnit;
};

export function HydrationTimeline({
  checkpoints,
  consumedMl,
  now = getDeviceNow(),
  unit,
}: HydrationTimelineProps) {
  return (
    <Card mode="contained" style={styles.card}>
      <Card.Content style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <View style={styles.iconBubble}>
              <DashboardIcon name={dashboardIcons.calendar} size={20} color={colors.cyanSoft} />
            </View>
            <View>
              <Text style={styles.kicker}>Local schedule</Text>
              <Text style={styles.title}>Today timeline</Text>
            </View>
          </View>
          <Text style={styles.link}>View full schedule</Text>
        </View>

        <View style={styles.timeline}>
          <View style={styles.rail} />
          {checkpoints.map((checkpoint) => {
            const status = getDeviceCheckpointStatus(checkpoint, consumedMl, now);

            return (
              <View key={checkpoint.id} style={styles.row}>
                <View style={[styles.dot, styles[status]]} />
                <View style={styles.copy}>
                  <Text style={styles.time}>{checkpoint.timeLabel}</Text>
                  <Text style={styles.amount}>{formatHydrationAmount(checkpoint.targetMl, unit)}</Text>
                </View>
                <Text style={[styles.status, styles[`${status}Text`]]}>{status}</Text>
              </View>
            );
          })}
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
    backgroundColor: 'rgba(10, 36, 55, 0.62)',
    ...glassShadow,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: spacing.md,
  },
  iconBubble: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(32, 199, 255, 0.1)',
  },
  kicker: {
    color: colors.muted,
    ...typography.h2,
  },
  title: {
    color: colors.text,
    ...typography.h1,
    marginTop: 2,
  },
  link: {
    color: colors.cyan,
    ...typography.h2,
  },
  timeline: {
    gap: spacing.md,
    position: 'relative',
  },
  rail: {
    position: 'absolute',
    bottom: 15,
    left: 9,
    top: 15,
    width: 2,
    borderRadius: 1,
    backgroundColor: colors.line,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 42,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderColor: colors.ink,
    borderWidth: 3,
    zIndex: 1,
  },
  Completed: {
    backgroundColor: colors.green,
  },
  Missed: {
    backgroundColor: colors.orange,
  },
  Upcoming: {
    backgroundColor: colors.cyan,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  time: {
    color: colors.text,
    ...typography.h1,
  },
  amount: {
    color: colors.muted,
    ...typography.body2,
    marginTop: 2,
  },
  status: {
    ...typography.h2,
  },
  CompletedText: {
    color: colors.green,
  },
  MissedText: {
    color: colors.orange,
  },
  UpcomingText: {
    color: colors.muted,
  },
});
