import { useCallback, useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Alert, AppState, Platform, ScrollView, StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Button, Card, ProgressBar, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  deactivateSoftLock,
  getLastDetectedPackageForDebug,
  getSoftLockStatus,
  isAccessibilityServiceEnabled,
  openAccessibilitySettings,
} from '@/src/features/accountability/nativeSoftLockAdapter';
import type { SoftLockAdapterStatus } from '@/src/features/accountability/nativeSoftLockAdapter';
import { getProtectedAppsByIds } from '@/src/features/accountability/protectedApps';
import { useAccountabilityStore } from '@/src/store/accountabilityStore';
import { useHydrationStore } from '@/src/store/hydrationStore';
import { useProfileStore } from '@/src/store/profileStore';
import { colors, glassShadow, radius, spacing, typography } from '@/src/theme/tokens';

const quickLogMl = 250;

export default function SoftLockScreen() {
  const insets = useSafeAreaInsets();
  const [accessibilityEnabled, setAccessibilityEnabled] = useState<boolean | null>(null);
  const [nativeStatus, setNativeStatus] = useState<SoftLockAdapterStatus | null>(null);
  const { progress, logWater } = useHydrationStore();
  const profile = useProfileStore((state) => state.profile);
  const {
    activeShield,
    dailySkipCount,
    dailySkipLimit,
    protectedAppIds,
    selectedApplicationCount,
    skipForNow,
  } = useAccountabilityStore();
  const protectedApps = useMemo(() => getProtectedAppsByIds(protectedAppIds), [protectedAppIds]);
  const shieldedAppCount =
    selectedApplicationCount || profile.softLockSelectedApplicationCount;
  const topSafePadding = Math.max(insets.top, 24);
  const bottomSafePadding = Math.max(insets.bottom, 24);
  const nativeRequiredAmountMl =
    nativeStatus?.isActive && nativeStatus.requiredAmountCl
      ? nativeStatus.requiredAmountCl * 10
      : null;
  const nativeActiveSessionId = nativeStatus?.isActive ? nativeStatus.activeSessionId : null;
  const requiredTotalMl =
    activeShield?.requiredAmountMl ??
    (nativeRequiredAmountMl ? progress.loggedMl + nativeRequiredAmountMl : progress.loggedMl + quickLogMl);
  const amountToLogMl = Math.max(requiredTotalMl - progress.loggedMl, quickLogMl);
  const skipsRemaining = Math.max(dailySkipLimit - dailySkipCount, 0);
  const refreshAccessibilityStatus = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return;
    }

    const [enabled, status] = await Promise.all([
      isAccessibilityServiceEnabled(),
      getSoftLockStatus(),
    ]);

    setAccessibilityEnabled(enabled);
    setNativeStatus(status);
  }, []);

  useEffect(() => {
    const initialRefresh = setTimeout(() => {
      void refreshAccessibilityStatus();
    }, 0);

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void refreshAccessibilityStatus();
      }
    });

    return () => {
      clearTimeout(initialRefresh);
      subscription.remove();
    };
  }, [refreshAccessibilityStatus]);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: topSafePadding,
          paddingBottom: bottomSafePadding,
        },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Card mode="contained" style={styles.card}>
        <Card.Content style={styles.content}>
          <View style={styles.shieldHalo}>
            <MaterialCommunityIcons name="shield-lock-outline" color={colors.cyan} size={92} />
            <View style={styles.waterDropBadge}>
              <MaterialCommunityIcons name="water-outline" color={colors.text} size={22} />
            </View>
          </View>
          <Text style={styles.kicker} variant="labelLarge">
            Hydration Shield
          </Text>
          <Text style={styles.title} variant="headlineSmall">
            Hydration check-in
          </Text>
          <Text style={styles.subtitle} variant="bodyLarge">
            Drink and log your water to continue.
          </Text>
          {shieldedAppCount > 0 ? (
            <View style={styles.shieldPanel}>
              <View style={styles.panelHeader}>
                <Text style={styles.panelLabel}>Protected apps</Text>
                <Text style={styles.panelValue}>{shieldedAppCount}</Text>
              </View>
              {protectedApps.length > 0 ? (
                <View style={styles.protectedAppRow}>
                  {protectedApps.slice(0, 4).map((app) => (
                    <View key={app.id} style={styles.protectedAppIcon}>
                      <MaterialCommunityIcons name={app.icon} color={app.tint} size={18} />
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}
          {activeShield ? (
            <Text style={styles.subtitle}>
              Your {activeShield.dueTimeLabel} checkpoint is waiting. Log the required water to
              restore access.
            </Text>
          ) : null}
          <ProgressBar
            color={colors.cyan}
            progress={progress.percentComplete / 100}
            style={styles.progressBar}
          />
          <Text style={styles.subtitle} variant="bodyMedium">
            {progress.loggedMl} ml logged. {progress.remainingMl} ml remaining today.
          </Text>
          <Button
            mode="contained"
            style={styles.primaryButton}
            onPress={async () => {
              logWater(amountToLogMl);

              if (!activeShield && nativeActiveSessionId) {
                await deactivateSoftLock({
                  reason: 'water_logged',
                  sessionId: nativeActiveSessionId,
                });
              }

              router.replace('/(tabs)');
            }}
          >
            Log {amountToLogMl} ml and continue
          </Button>
          <Text style={styles.caption}>
            WaterFirst removes the shield after you log the required amount.
          </Text>
          <Button
            mode="outlined"
            textColor={colors.cyanSoft}
            onPress={async () => {
              try {
                if (activeShield) {
                  await deactivateSoftLock({
                    reason: 'skip',
                    sessionId: activeShield.checkpointId,
                  });
                } else if (nativeActiveSessionId) {
                  await deactivateSoftLock({
                    reason: 'skip',
                    sessionId: nativeActiveSessionId,
                  });
                }

                skipForNow();
                router.replace('/(tabs)');
              } catch (error) {
                Alert.alert(
                  'Could not skip',
                  error instanceof Error
                    ? error.message
                    : 'Waterfirst could not remove the native Soft Lock.',
                );
              }
            }}
            disabled={skipsRemaining === 0}
          >
            Skip for now ({skipsRemaining} left today)
          </Button>
          <Text style={styles.caption}>
            Emergency skips pause the shield for 15 minutes and are limited daily.
          </Text>
          {Platform.OS === 'android' ? (
            <View style={styles.androidDebugPanel}>
              <Text style={styles.panelLabel}>Android permission test</Text>
              <Text style={styles.panelValue}>
                Accessibility Service:{' '}
                {accessibilityEnabled ? 'Enabled' : 'Not enabled'}
              </Text>
              <Button
                mode="outlined"
                textColor={colors.cyanSoft}
                onPress={async () => {
                  try {
                    await openAccessibilitySettings();
                  } catch (error) {
                    Alert.alert(
                      'Could not open settings',
                      error instanceof Error
                        ? error.message
                        : 'Waterfirst could not open Android Accessibility Settings.',
                    );
                  }
                }}
              >
                Open Accessibility Settings
              </Button>
              <Button mode="outlined" textColor={colors.cyanSoft} onPress={refreshAccessibilityStatus}>
                Refresh Permission Status
              </Button>
              {__DEV__ ? (
                <Button
                  mode="outlined"
                  textColor={colors.cyanSoft}
                  onPress={async () => {
                    const lastDetectedPackage = await getLastDetectedPackageForDebug();
                    Alert.alert(
                      'Last detected app',
                      lastDetectedPackage ?? 'No foreground app package detected yet.',
                    );
                  }}
                >
                  Check Last Detected App
                </Button>
              ) : null}
            </View>
          ) : null}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.ink,
  },
  card: {
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    backgroundColor: colors.midnight,
    ...glassShadow,
  },
  content: {
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
  },
  shieldHalo: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: 'rgba(32, 199, 255, 0.09)',
  },
  waterDropBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: 12,
    bottom: 18,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.blue,
  },
  kicker: {
    color: colors.orange,
    ...typography.h2,
  },
  title: {
    color: colors.text,
    ...typography.h1,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.muted,
    ...typography.body1,
    textAlign: 'center',
  },
  progressBar: {
    alignSelf: 'stretch',
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.cardRaised,
  },
  primaryButton: {
    alignSelf: 'stretch',
    borderRadius: radius.md,
    backgroundColor: colors.cyan,
  },
  shieldPanel: {
    alignSelf: 'stretch',
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
    backgroundColor: colors.panel,
  },
  panelHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  protectedAppRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  protectedAppIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: 'rgba(3, 16, 28, 0.62)',
  },
  androidDebugPanel: {
    alignSelf: 'stretch',
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.panel,
  },
  panelLabel: {
    color: colors.muted,
    ...typography.h2,
  },
  panelValue: {
    color: colors.text,
    ...typography.h1,
  },
  caption: {
    color: colors.faint,
    ...typography.body2,
    textAlign: 'center',
  },
});
