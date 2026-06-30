import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import {
  getCheckpointStatus as getDeviceCheckpointStatus,
  getDeviceNow,
} from '@/src/features/hydration/deviceTime';
import { formatHydrationAmount, type HydrationUnit } from '@/src/features/hydration/units';
import type { HydrationCheckpoint } from '@/src/features/hydration/types';
import { colors, glassShadow, radius, spacing, type } from '@/src/theme/tokens';

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
            <View style={styles.icon} />
            <Text style={styles.title} variant="titleLarge">
              Today Timeline
            </Text>
          </View>
          <Text style={styles.link}>View Full Schedule ›</Text>
        </View>
        {checkpoints.map((checkpoint) => {
          const status = getDeviceCheckpointStatus(checkpoint, consumedMl, now);

          return (
            <View key={checkpoint.id} style={styles.row}>
              <View style={[styles.dot, styles[status]]} />
              <View style={styles.timeColumn}>
                <Text style={styles.line}>{checkpoint.timeLabel}</Text>
              </View>
              <View style={styles.amountColumn}>
                <Text style={styles.line}>{formatHydrationAmount(checkpoint.targetMl, unit)}</Text>
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

const styles = StyleSheet.create({
  card: {
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.glass,
    ...glassShadow,
  },
  content: {
    gap: spacing.md,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  icon: {
    width: 18,
    height: 18,
    borderColor: colors.cyan,
    borderRadius: 4,
    borderWidth: 2,
    backgroundColor: 'rgba(32, 199, 255, 0.16)',
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
    gap: spacing.sm,
  },
  dot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    borderColor: colors.ink,
    borderWidth: 2,
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
    minWidth: 72,
    borderLeftColor: colors.line,
    borderLeftWidth: 1,
    paddingLeft: spacing.sm,
  },
  amountColumn: {
    flexBasis: 56,
    flexShrink: 1,
  },
  statusColumn: {
    flexBasis: 76,
    flexShrink: 1,
  },
  line: {
    color: colors.text,
    fontFamily: type.data,
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
