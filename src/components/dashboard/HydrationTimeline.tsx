import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { formatHydrationAmount, type HydrationUnit } from '@/src/features/hydration/units';
import type { HydrationCheckpoint } from '@/src/features/hydration/types';
import { colors, radius, spacing } from '@/src/theme/tokens';

type TimelineStatus = 'Completed' | 'Missed' | 'Upcoming';

type HydrationTimelineProps = {
  checkpoints: HydrationCheckpoint[];
  consumedMl: number;
  unit: HydrationUnit;
};

export function HydrationTimeline({ checkpoints, consumedMl, unit }: HydrationTimelineProps) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return (
    <Card mode="contained" style={styles.card}>
      <Card.Content style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <Text style={styles.icon}>▣</Text>
            <Text style={styles.title} variant="titleLarge">
              Today Timeline
            </Text>
          </View>
          <Text style={styles.link}>View Full Schedule ›</Text>
        </View>
        {checkpoints.map((checkpoint) => {
          const status = getCheckpointStatus(checkpoint, consumedMl, currentMinutes);

          return (
            <View key={checkpoint.id} style={styles.row}>
              <View style={[styles.dot, styles[status]]} />
              <View style={styles.timeColumn}>
                <Text style={styles.line}>{checkpoint.timeLabel}</Text>
              </View>
              <View style={styles.amountColumn}>
                <Text style={styles.line}>{formatHydrationAmount(500, unit)}</Text>
              </View>
              <View style={styles.statusColumn}>
                <Text style={[styles.status, styles[`${status}Text`]]}>{status}</Text>
              </View>
            </View>
          );
        })}
      </Card.Content>
    </Card>
  );
}

function getCheckpointStatus(
  checkpoint: HydrationCheckpoint,
  consumedMl: number,
  currentMinutes: number,
): TimelineStatus {
  if (consumedMl >= checkpoint.targetMl) {
    return 'Completed';
  }

  if (checkpoint.dueMinutes < currentMinutes) {
    return 'Missed';
  }

  return 'Upcoming';
}

const styles = StyleSheet.create({
  card: {
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.card,
  },
  content: {
    gap: spacing.md,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  icon: {
    color: colors.cyan,
    fontSize: 20,
  },
  title: {
    color: colors.text,
    fontWeight: '900',
  },
  link: {
    color: colors.cyan,
    fontSize: 13,
    fontWeight: '700',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
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
  timeColumn: {
    flex: 1,
    borderLeftColor: colors.border,
    borderLeftWidth: 1,
    paddingLeft: spacing.md,
  },
  amountColumn: {
    width: 74,
  },
  statusColumn: {
    width: 86,
  },
  line: {
    color: colors.text,
    fontWeight: '700',
  },
  status: {
    fontSize: 12,
    fontWeight: '800',
  },
  CompletedText: {
    color: colors.green,
  },
  MissedText: {
    color: colors.orange,
  },
  UpcomingText: {
    color: colors.cyan,
  },
});
