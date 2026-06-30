import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { UnitSwitcher } from '@/src/components/dashboard/UnitSwitcher';
import {
  formatLocalDateLabel,
  formatLocalTime,
  getDeviceNow,
  getLocalDateKey,
  sumLogsForLocalDate,
} from '@/src/features/hydration/deviceTime';
import { formatHydrationAmount, type HydrationUnit } from '@/src/features/hydration/units';
import type { HydrationLog } from '@/src/features/hydration/types';
import { useHydrationStore } from '@/src/store/hydrationStore';
import { colors, glassShadow, radius, spacing, type } from '@/src/theme/tokens';

type CalendarDay = {
  date: Date;
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isFuture: boolean;
  isToday: boolean;
  loggedMl: number;
  logCount: number;
  percentComplete: number;
};

const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function HistoryScreen() {
  const logs = useHydrationStore((state) => state.logs);
  const targetMl = useHydrationStore((state) => state.goal.targetMl);
  const now = getDeviceNow();
  const [visibleMonth, setVisibleMonth] = useState(() => getMonthStart(now));
  const [selectedDateKey, setSelectedDateKey] = useState(() => getLocalDateKey(now));
  const [unit, setUnit] = useState<HydrationUnit>('cl');

  const calendarDays = useMemo(
    () => buildCalendarDays(visibleMonth, logs, targetMl, now),
    [logs, now, targetMl, visibleMonth],
  );
  const selectedDay = useMemo(
    () => calendarDays.find((day) => day.dateKey === selectedDateKey) ?? getDaySummary(selectedDateKey, logs, targetMl, now),
    [calendarDays, logs, now, selectedDateKey, targetMl],
  );
  const selectedLogs = useMemo(
    () =>
      logs
        .filter((log) => getLocalDateKey(new Date(log.loggedAt)) === selectedDateKey)
        .sort((left, right) => new Date(right.loggedAt).getTime() - new Date(left.loggedAt).getTime()),
    [logs, selectedDateKey],
  );
  const monthLabel = visibleMonth.toLocaleDateString([], {
    month: 'long',
    year: 'numeric',
  });

  return (
    <ScrollView contentContainerStyle={styles.container} showsHorizontalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Local hydration history</Text>
          <Text style={styles.title} variant="headlineSmall">
            History
          </Text>
        </View>
        <UnitSwitcher unit={unit} onChange={setUnit} />
      </View>

      <Card mode="contained" style={styles.calendarCard}>
        <Card.Content style={styles.calendarContent}>
          <View style={styles.monthHeader}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous month"
              style={styles.monthButton}
              onPress={() => setVisibleMonth((date) => addMonths(date, -1))}
            >
              <Text style={styles.monthButtonText}>{'<'}</Text>
            </Pressable>
            <Text style={styles.monthTitle}>{monthLabel}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next month"
              style={styles.monthButton}
              onPress={() => setVisibleMonth((date) => addMonths(date, 1))}
            >
              <Text style={styles.monthButtonText}>{'>'}</Text>
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {weekDays.map((day, index) => (
              <Text key={`${day}-${index}`} style={styles.weekDay}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarDays.map((day) => (
              <CalendarDayCell
                key={day.dateKey}
                day={day}
                isSelected={day.dateKey === selectedDateKey}
                onPress={() => {
                  if (!day.isFuture) {
                    setSelectedDateKey(day.dateKey);
                  }
                }}
              />
            ))}
          </View>
        </Card.Content>
      </Card>

      <DailySummaryCard
        day={selectedDay}
        logs={selectedLogs}
        targetMl={targetMl}
        unit={unit}
      />
    </ScrollView>
  );
}

type CalendarDayCellProps = {
  day: CalendarDay;
  isSelected: boolean;
  onPress: () => void;
};

function CalendarDayCell({ day, isSelected, onPress }: CalendarDayCellProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: day.isFuture, selected: isSelected }}
      disabled={day.isFuture}
      style={[
        styles.dayCell,
        !day.isCurrentMonth && styles.dayCellOutsideMonth,
        day.isToday && styles.todayCell,
        isSelected && styles.selectedCell,
        day.isFuture && styles.futureCell,
      ]}
      onPress={onPress}
    >
      <ProgressRing
        muted={!day.isCurrentMonth || day.isFuture}
        progress={day.percentComplete}
      >
        <Text
          style={[
            styles.dayNumber,
            !day.isCurrentMonth && styles.mutedText,
            day.isFuture && styles.futureText,
            isSelected && styles.selectedDayNumber,
          ]}
        >
          {day.dayNumber}
        </Text>
      </ProgressRing>
      <Text style={[styles.dayPercent, day.isFuture && styles.futureText]}>
        {day.isFuture ? '--' : `${Math.min(day.percentComplete, 100)}%`}
      </Text>
    </Pressable>
  );
}

type ProgressRingProps = {
  children: React.ReactNode;
  muted: boolean;
  progress: number;
};

function ProgressRing({ children, muted, progress }: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(progress, 100));
  const hasProgress = clamped > 0;
  const isComplete = clamped >= 100;
  const firstHalfRotation = `${Math.min(clamped, 50) * 3.6}deg`;
  const secondHalfRotation = `${Math.max(clamped - 50, 0) * 3.6}deg`;

  return (
    <View
      style={[
        styles.ringBase,
        isComplete && !muted && styles.ringBaseComplete,
        muted && styles.ringBaseMuted,
      ]}
    >
      {hasProgress && !isComplete && !muted ? (
        <>
          <View style={styles.ringHalfClipRight}>
            <View
              style={[
                styles.ringHalf,
                styles.ringHalfRight,
                { transform: [{ rotate: firstHalfRotation }] },
              ]}
            />
          </View>
          <View style={styles.ringHalfClipLeft}>
            <View
              style={[
                styles.ringHalf,
                styles.ringHalfLeft,
                {
                  opacity: clamped > 50 ? 1 : 0,
                  transform: [{ rotate: secondHalfRotation }],
                },
              ]}
            />
          </View>
        </>
      ) : null}
      <View style={styles.ringInner}>{children}</View>
    </View>
  );
}

type DailySummaryCardProps = {
  day: CalendarDay;
  logs: HydrationLog[];
  targetMl: number;
  unit: HydrationUnit;
};

function DailySummaryCard({ day, logs, targetMl, unit }: DailySummaryCardProps) {
  const message = getEncouragingMessage(day.percentComplete);

  return (
    <Card mode="contained" style={styles.summaryCard}>
      <Card.Content style={styles.summaryContent}>
        <View style={styles.summaryHeader}>
          <View>
            <Text style={styles.kicker}>Daily summary</Text>
            <Text style={styles.summaryTitle}>{formatLocalDateLabel(day.dateKey)}</Text>
          </View>
          <View style={styles.summaryBadge}>
            <Text style={styles.summaryBadgeText}>{Math.min(day.percentComplete, 100)}%</Text>
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <SummaryMetric label="Water taken" value={formatHydrationAmount(day.loggedMl, unit)} />
          <SummaryMetric label="Daily target" value={formatHydrationAmount(targetMl, unit)} />
          <SummaryMetric label="Entries" value={String(day.logCount)} />
        </View>

        <Text style={styles.message}>{message}</Text>

        <View style={styles.logList}>
          <Text style={styles.logTitle}>Entries</Text>
          {logs.length === 0 ? (
            <Text style={styles.emptyText}>No water logged for this local day yet.</Text>
          ) : (
            logs.map((log) => (
              <View key={log.id} style={styles.logRow}>
                <Text style={styles.logAmount}>{formatHydrationAmount(log.amountMl, unit)}</Text>
                <Text style={styles.logTime}>{formatLocalTime(log.loggedAt)}</Text>
              </View>
            ))
          )}
        </View>
      </Card.Content>
    </Card>
  );
}

type SummaryMetricProps = {
  label: string;
  value: string;
};

function SummaryMetric({ label, value }: SummaryMetricProps) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function buildCalendarDays(monthStart: Date, logs: HydrationLog[], targetMl: number, now: Date) {
  const firstVisibleDate = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1);
  firstVisibleDate.setDate(firstVisibleDate.getDate() - firstVisibleDate.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstVisibleDate);
    date.setDate(firstVisibleDate.getDate() + index);

    return getDaySummary(getLocalDateKey(date), logs, targetMl, now, monthStart);
  });
}

function getDaySummary(
  dateKey: string,
  logs: HydrationLog[],
  targetMl: number,
  now: Date,
  visibleMonth?: Date,
): CalendarDay {
  const date = parseLocalDateKey(dateKey);
  const loggedMl = sumLogsForLocalDate(logs, date);
  const percentComplete = Math.min(100, Math.round((loggedMl / Math.max(targetMl, 1)) * 100));
  const todayKey = getLocalDateKey(now);
  const monthAnchor = visibleMonth ?? date;

  return {
    date,
    dateKey,
    dayNumber: date.getDate(),
    isCurrentMonth: date.getMonth() === monthAnchor.getMonth(),
    isFuture: dateKey > todayKey,
    isToday: dateKey === todayKey,
    loggedMl,
    logCount: logs.filter((log) => getLocalDateKey(new Date(log.loggedAt)) === dateKey).length,
    percentComplete,
  };
}

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function parseLocalDateKey(dateKey: string) {
  const [yearValue, monthValue, dayValue] = dateKey.split('-').map(Number);
  const year = Number.isFinite(yearValue) ? yearValue : getDeviceNow().getFullYear();
  const month = Number.isFinite(monthValue) ? monthValue : 1;
  const day = Number.isFinite(dayValue) ? dayValue : 1;

  return new Date(year, month - 1, day);
}

function getEncouragingMessage(percentComplete: number) {
  if (percentComplete >= 100) {
    return 'Goal completed. Your kidneys are fully replenished.';
  }

  if (percentComplete >= 50) {
    return 'Good progress. Keep going.';
  }

  return 'You can still catch up.';
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: 110,
    backgroundColor: colors.ink,
  },
  header: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: 'rgba(3, 16, 28, 0.62)',
    ...glassShadow,
  },
  kicker: {
    color: colors.cyanSoft,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontWeight: '900',
  },
  calendarCard: {
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: colors.glass,
    ...glassShadow,
  },
  calendarContent: {
    gap: spacing.md,
  },
  monthHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthButton: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
    backgroundColor: 'transparent',
  },
  monthButtonText: {
    color: colors.cyan,
    fontFamily: type.data,
    fontSize: 18,
    fontWeight: '900',
  },
  monthTitle: {
    color: colors.text,
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDay: {
    color: colors.muted,
    flex: 1,
    fontFamily: type.data,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.sm,
  },
  dayCell: {
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 62,
    width: `${100 / 7}%`,
  },
  dayCellOutsideMonth: {
    opacity: 0.48,
  },
  todayCell: {
    opacity: 1,
  },
  selectedCell: {
    opacity: 1,
  },
  futureCell: {
    opacity: 0.34,
  },
  ringBase: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 3,
    height: 44,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 44,
    backgroundColor: 'rgba(3, 16, 28, 0.7)',
  },
  ringBaseMuted: {
    borderColor: 'rgba(97, 127, 149, 0.34)',
  },
  ringBaseComplete: {
    borderColor: colors.cyan,
  },
  ringHalfClipRight: {
    position: 'absolute',
    right: 0,
    top: -3,
    height: 44,
    overflow: 'hidden',
    width: 22,
  },
  ringHalfClipLeft: {
    position: 'absolute',
    left: 0,
    top: -3,
    height: 44,
    overflow: 'hidden',
    width: 22,
  },
  ringHalf: {
    position: 'absolute',
    borderColor: colors.cyan,
    borderRadius: 22,
    borderWidth: 3,
    height: 44,
    width: 44,
  },
  ringHalfRight: {
    right: 0,
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  ringHalfLeft: {
    left: 0,
    borderRightColor: 'transparent',
    borderTopColor: 'transparent',
  },
  ringInner: {
    alignItems: 'center',
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    width: 34,
    backgroundColor: colors.midnight,
  },
  dayNumber: {
    color: colors.text,
    fontFamily: type.data,
    fontSize: 13,
    fontWeight: '900',
  },
  selectedDayNumber: {
    color: colors.cyanSoft,
  },
  mutedText: {
    color: colors.faint,
  },
  futureText: {
    color: colors.faint,
  },
  dayPercent: {
    color: colors.muted,
    fontFamily: type.data,
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
  },
  summaryCard: {
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.glass,
    ...glassShadow,
  },
  summaryContent: {
    gap: spacing.md,
  },
  summaryHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  summaryTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  summaryBadge: {
    alignItems: 'center',
    borderColor: colors.cyan,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 42,
    minWidth: 58,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(32, 199, 255, 0.14)',
  },
  summaryBadgeText: {
    color: colors.cyan,
    fontFamily: type.data,
    fontWeight: '900',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricCard: {
    borderColor: colors.line,
    borderRadius: radius.md,
    borderWidth: 1,
    flexBasis: 96,
    flexGrow: 1,
    gap: spacing.xs,
    padding: spacing.sm,
    backgroundColor: colors.glassStrong,
  },
  metricValue: {
    color: colors.text,
    fontFamily: type.data,
    fontSize: 18,
    fontWeight: '900',
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  message: {
    borderColor: colors.line,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.cyanSoft,
    fontWeight: '800',
    lineHeight: 21,
    padding: spacing.md,
    backgroundColor: 'rgba(3, 16, 28, 0.48)',
  },
  logList: {
    gap: spacing.sm,
  },
  logTitle: {
    color: colors.text,
    fontWeight: '900',
  },
  emptyText: {
    color: colors.muted,
    lineHeight: 21,
  },
  logRow: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(3, 16, 28, 0.42)',
  },
  logAmount: {
    color: colors.cyan,
    fontFamily: type.data,
    fontWeight: '900',
  },
  logTime: {
    color: colors.muted,
    fontWeight: '700',
  },
});
