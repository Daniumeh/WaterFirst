import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Alert, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardIcon, dashboardIcons } from '@/src/components/dashboard/DashboardIcon';
import { HydrationHeroCard } from '@/src/components/dashboard/HydrationHeroCard';
import { HydrationTimeline } from '@/src/components/dashboard/HydrationTimeline';
import { QuickLogWater } from '@/src/components/dashboard/QuickLogWater';
import { SoftLockStatusCard } from '@/src/components/dashboard/SoftLockStatusCard';
import {
  activateSoftLock,
  getSoftLockStatus,
  type SoftLockRuntime,
} from '@/src/features/accountability/nativeSoftLockAdapter';
import {
  calculateComplianceScore,
  getActionCheckpoint,
  getDeviceNow,
} from '@/src/features/hydration/deviceTime';
import type { HydrationUnit } from '@/src/features/hydration/units';
import { useAccountabilityStore } from '@/src/store/accountabilityStore';
import { useHydrationStore } from '@/src/store/hydrationStore';
import { useProfileStore } from '@/src/store/profileStore';
import { colors, spacing, typography } from '@/src/theme/tokens';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const profile = useProfileStore((state) => state.profile);
  const activeShield = useAccountabilityStore((state) => state.activeShield);
  const activateShield = useAccountabilityStore((state) => state.activateShield);
  const releaseShield = useAccountabilityStore((state) => state.releaseShield);
  const selectedApplicationCount = useAccountabilityStore((state) => state.selectedApplicationCount);
  const setSelectedApplicationCount = useAccountabilityStore((state) => state.setSelectedApplicationCount);
  const { checkpoints, goal, logWater, progress, syncWithDeviceDate } = useHydrationStore();
  const [now, setNow] = useState(() => getDeviceNow());
  const [unit, setUnit] = useState<HydrationUnit>('cl');
  const [customAmount, setCustomAmount] = useState('');
  const [softLockRuntime, setSoftLockRuntime] = useState<SoftLockRuntime | null>(null);

  useEffect(() => {
    syncWithDeviceDate();

    const interval = setInterval(() => {
      setNow(getDeviceNow());
      syncWithDeviceDate();
    }, 60000);

    return () => clearInterval(interval);
  }, [syncWithDeviceDate]);

  useEffect(() => {
    setSelectedApplicationCount(profile.softLockSelectedApplicationCount);
  }, [profile.softLockSelectedApplicationCount, setSelectedApplicationCount]);

  useEffect(() => {
    void getSoftLockStatus()
      .then((status) => {
        setSoftLockRuntime(status.runtime);
        setSelectedApplicationCount(status.selectedApplicationCount);
      })
      .catch(() => undefined);
  }, [setSelectedApplicationCount]);

  const actionCheckpoint = useMemo(
    () => getActionCheckpoint(checkpoints, progress.loggedMl, now),
    [checkpoints, now, progress.loggedMl],
  );
  const complianceScore = useMemo(
    () => calculateComplianceScore(checkpoints, progress.loggedMl, now),
    [checkpoints, now, progress.loggedMl],
  );
  const nextEnforcementTime = actionCheckpoint?.timeLabel ?? 'Tomorrow';
  const firstName = profile.firstName || profile.name.split(' ')[0] || 'Lebe';
  const isCompactPhone = Math.min(width, 430) <= 360;
  const topSafePadding = Math.max(insets.top + spacing.md, spacing.lg);
  const bottomSafePadding = Math.max(insets.bottom + 96, 112);
  const greeting = getLocalGreeting(now);
  const activeSelectedApplicationCount =
    selectedApplicationCount || profile.softLockSelectedApplicationCount;

  const handleTestSoftLock = async () => {
    if (activeShield) {
      router.push('/soft-lock');
      return;
    }

    const sessionId = `test-${Date.now()}`;
    const session = {
      activatedAt: now.toISOString(),
      checkpointId: sessionId,
      dueTimeLabel: 'Test Soft Lock',
      requiredAmountMl: progress.loggedMl + 250,
    };

    try {
      await activateSoftLock({
        activatedAt: session.activatedAt,
        requiredAmountCl: 25,
        sessionId,
      });
      activateShield(session);
      router.push('/soft-lock');
    } catch (error) {
      Alert.alert(
        'Soft Lock unavailable',
        error instanceof Error
          ? error.message
          : 'Waterfirst could not activate the native Soft Lock test.',
      );
    }
  };

  useEffect(() => {
    if (activeShield && progress.loggedMl >= activeShield.requiredAmountMl) {
      releaseShield();
    }
  }, [activeShield, progress.loggedMl, releaseShield]);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        isCompactPhone && styles.compactContainer,
        {
          paddingBottom: bottomSafePadding,
          paddingTop: topSafePadding,
        },
      ]}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting} variant="headlineSmall">
            {greeting}, {firstName} 👋
          </Text>
          <Text style={styles.subtitle}>Staying hydrated = healthy living</Text>
        </View>
        <View style={styles.bellWrap}>
          <DashboardIcon name={dashboardIcons.bell} size={22} color={colors.text} />
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
        unit={unit}
      />

      <SoftLockStatusCard
        enabled={profile.softLockConsent}
        nextEnforcementTime={nextEnforcementTime}
        complianceScore={complianceScore}
        canTestSoftLock={
          profile.softLockConsent &&
          (activeSelectedApplicationCount > 0 || softLockRuntime === 'androidPreview')
        }
        shieldedAppCount={activeSelectedApplicationCount}
        onTestSoftLock={handleTestSoftLock}
      />

      <HydrationTimeline checkpoints={checkpoints} consumedMl={progress.loggedMl} now={now} unit={unit} />
    </ScrollView>
  );
}

function getLocalGreeting(now: Date) {
  const hour = now.getHours();

  if (hour < 12) {
    return 'Good morning';
  }

  if (hour < 17) {
    return 'Good afternoon';
  }

  return 'Good evening';
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.ink,
  },
  compactContainer: {
    gap: spacing.md,
    padding: spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  greeting: {
    color: colors.text,
    ...typography.h1,
    letterSpacing: 0,
  },
  subtitle: {
    color: colors.muted,
    ...typography.body1,
    marginTop: spacing.xs,
  },
  bellWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderColor: colors.line,
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: 'rgba(10, 36, 55, 0.68)',
  },
  bellDot: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.cyan,
  },
});
