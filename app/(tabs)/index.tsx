import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from 'react-native-paper';

import { HealthInsightsCard } from '@/src/components/dashboard/HealthInsightsCard';
import { HydrationActionCard } from '@/src/components/dashboard/HydrationActionCard';
import { HydrationHeroCard } from '@/src/components/dashboard/HydrationHeroCard';
import { HydrationTimeline } from '@/src/components/dashboard/HydrationTimeline';
import { QuickLogWater } from '@/src/components/dashboard/QuickLogWater';
import { SoftLockStatusCard } from '@/src/components/dashboard/SoftLockStatusCard';
import { StatsCard } from '@/src/components/dashboard/StatsCard';
import {
  calculateComplianceScore,
  calculateExpectedMlByNow,
  calculateLocalStreak,
  filterLogsForLocalDate,
  getActionCheckpoint,
  getDeviceNow,
  getDeviceTimeZone,
  minutesUntilLocalMidnight,
} from '@/src/features/hydration/deviceTime';
import type { HydrationUnit } from '@/src/features/hydration/units';
import { formatHydrationAmount } from '@/src/features/hydration/units';
import { useHydrationStore } from '@/src/store/hydrationStore';
import { useProfileStore } from '@/src/store/profileStore';
import { colors, glassShadow, radius, spacing, type } from '@/src/theme/tokens';

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const profile = useProfileStore((state) => state.profile);
  const { checkpoints, goal, logWater, logs, progress, syncWithDeviceDate } = useHydrationStore();
  const [now, setNow] = useState(() => getDeviceNow());
  const [unit, setUnit] = useState<HydrationUnit>('cl');
  const [customAmount, setCustomAmount] = useState('');

  useEffect(() => {
    syncWithDeviceDate();

    const interval = setInterval(() => {
      setNow(getDeviceNow());
      syncWithDeviceDate();
    }, 60000);

    return () => clearInterval(interval);
  }, [syncWithDeviceDate]);

  const actionCheckpoint = useMemo(
    () => getActionCheckpoint(checkpoints, progress.loggedMl, now),
    [checkpoints, now, progress.loggedMl],
  );
  const complianceScore = useMemo(
    () => calculateComplianceScore(checkpoints, progress.loggedMl, now),
    [checkpoints, now, progress.loggedMl],
  );
  const nextEnforcementTime = actionCheckpoint?.timeLabel ?? 'Tomorrow';
  const todayLogs = useMemo(() => filterLogsForLocalDate(logs, now), [logs, now]);
  const expectedMlByNow = useMemo(
    () => calculateExpectedMlByNow(checkpoints, goal.targetMl, now),
    [checkpoints, goal.targetMl, now],
  );
  const insights = useMemo(
    () =>
      buildHealthInsights({
        complianceScore,
        drinkCount: todayLogs.length,
        expectedMlByNow,
        loggedMl: progress.loggedMl,
        minutesUntilReset: minutesUntilLocalMidnight(now),
        percentComplete: progress.percentComplete,
        timeZone: getDeviceTimeZone(),
      }),
    [
      complianceScore,
      expectedMlByNow,
      now,
      progress.loggedMl,
      progress.percentComplete,
      todayLogs.length,
    ],
  );
  const currentStreak = useMemo(
    () => calculateLocalStreak(logs, goal.targetMl, now),
    [goal.targetMl, logs, now],
  );
  const firstName = profile.firstName || 'Hydra';
  const isCompactPhone = Math.min(width, 430) <= 360;
  const localTimeLabel = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        isCompactPhone && styles.compactContainer,
      ]}
      showsHorizontalScrollIndicator={false}
    >
      <View style={styles.reservoirBand} />
      <View style={styles.waterline} />
      <View style={styles.statusBar}>
        <Text style={styles.timeText}>{localTimeLabel}</Text>
        <Text style={styles.signalText}>▮▮▮ ᯤ ▱</Text>
      </View>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Daily reservoir for {firstName}</Text>
          <Text style={styles.brand} variant="headlineSmall">
            Hydra<Text style={styles.brandAccent}>Lock</Text>
          </Text>
          <Text style={styles.subtitle}>Stay hydrated. Stay unstoppable.</Text>
        </View>
        <View style={styles.bellWrap}>
          <View style={styles.bell} />
          <View style={styles.bellDot} />
        </View>
      </View>

      <HydrationHeroCard
        consumedMl={progress.loggedMl}
        targetMl={goal.targetMl}
        unit={unit}
        onUnitChange={setUnit}
      />

      <QuickLogWater
        customAmount={customAmount}
        onCustomAmountChange={setCustomAmount}
        onLog={logWater}
      />

      <View style={[styles.actionGrid, isCompactPhone && styles.actionGridCompact]}>
        <HydrationActionCard
          checkpoint={actionCheckpoint}
          consumedMl={progress.loggedMl}
          now={now}
          unit={unit}
        />

        <SoftLockStatusCard
          enabled={profile.softLockConsent}
          nextEnforcementTime={nextEnforcementTime}
          complianceScore={complianceScore}
        />
      </View>

      <View style={styles.statsStrip}>
        <StatsCard
          label="Consumed Today"
          value={formatHydrationAmount(progress.loggedMl, unit)}
          helper={`${todayLogs.length} Drinks`}
        />
        <StatsCard
          label="Remaining"
          value={formatHydrationAmount(progress.remainingMl, unit)}
          helper="To goal"
        />
        <StatsCard label="Current Streak" value={`${currentStreak} Days`} helper="Local streak" />
      </View>

      <HealthInsightsCard insights={insights} />

      <HydrationTimeline checkpoints={checkpoints} consumedMl={progress.loggedMl} now={now} unit={unit} />
    </ScrollView>
  );
}

type HealthInsightInput = {
  complianceScore: number;
  drinkCount: number;
  expectedMlByNow: number;
  loggedMl: number;
  minutesUntilReset: number;
  percentComplete: number;
  timeZone: string;
};

function buildHealthInsights({
  complianceScore,
  drinkCount,
  expectedMlByNow,
  loggedMl,
  minutesUntilReset,
  percentComplete,
  timeZone,
}: HealthInsightInput) {
  const insights = [];
  const scheduleDelta = loggedMl - expectedMlByNow;
  const schedulePercent = expectedMlByNow > 0 ? Math.round((scheduleDelta / expectedMlByNow) * 100) : 0;

  if (percentComplete >= 100) {
    insights.push('Great job staying consistent. You completed your hydration goal today.');
  } else if (schedulePercent >= 10) {
    insights.push(`You're ${schedulePercent}% ahead of your local schedule today.`);
  } else if (schedulePercent <= -10) {
    insights.push("Your next drink can bring you back toward today's local schedule.");
  } else if (percentComplete >= 65) {
    insights.push("You're ahead of your usual pace today. Keep the rhythm steady.");
  } else {
    insights.push('A quick drink now can help you stay close to your daily plan.');
  }

  if (complianceScore >= 75) {
    insights.push('Your checkpoint follow-through is strong today.');
  } else {
    insights.push('Your next checkpoint is a good chance to reset the afternoon habit.');
  }

  if (drinkCount >= 4) {
    insights.push('Frequent small drinks are working well for you today.');
  } else {
    insights.push(`Today resets in about ${minutesUntilReset} minutes on your phone's local time.`);
  }

  insights.push(`Timing is following your device timezone: ${timeZone}.`);

  return insights;
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: 100,
    backgroundColor: colors.ink,
  },
  compactContainer: {
    padding: spacing.sm,
    paddingBottom: 96,
  },
  reservoirBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 128,
    height: 104,
    backgroundColor: 'rgba(20, 125, 255, 0.12)',
  },
  waterline: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 100,
    height: 1,
    backgroundColor: colors.line,
  },
  statusBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  timeText: {
    color: colors.text,
    fontFamily: type.data,
    fontSize: 18,
    fontWeight: '900',
  },
  signalText: {
    color: colors.text,
    fontFamily: type.data,
    fontSize: 16,
    fontWeight: '900',
  },
  header: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(3, 16, 28, 0.62)',
    ...glassShadow,
  },
  greeting: {
    color: colors.cyanSoft,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  brand: {
    color: colors.text,
    fontWeight: '900',
  },
  brandAccent: {
    color: colors.cyan,
  },
  subtitle: {
    color: colors.muted,
    lineHeight: 21,
  },
  bellWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 42,
    height: 42,
    borderColor: colors.line,
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: colors.glass,
  },
  bell: {
    width: 17,
    height: 21,
    borderColor: colors.muted,
    borderRadius: 7,
    borderWidth: 2,
    borderBottomWidth: 3,
  },
  bellDot: {
    position: 'absolute',
    right: 5,
    top: 5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.cyan,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionGridCompact: {
    gap: spacing.sm,
  },
  statsStrip: {
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: colors.glass,
    ...glassShadow,
  },
});
