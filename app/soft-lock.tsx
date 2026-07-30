import { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Alert, AppState, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, ProgressBar, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  deactivateSoftLock,
  getLastDetectedPackageForDebug,
  isAccessibilityServiceEnabled,
  openAccessibilitySettings,
} from '@/src/features/accountability/nativeSoftLockAdapter';
import { useAccountabilityStore } from '@/src/store/accountabilityStore';
import { useHydrationStore } from '@/src/store/hydrationStore';
import { useProfileStore } from '@/src/store/profileStore';
import { colors, radius, shadow, spacing, typography } from '@/src/theme/tokens';

const quickLogMl = 250;

export default function SoftLockScreen() {
  const insets = useSafeAreaInsets();
  const [accessibilityEnabled, setAccessibilityEnabled] = useState<boolean | null>(null);
  const { progress, logWater } = useHydrationStore();
  const profile = useProfileStore((state) => state.profile);
  const {
    activeShield,
    dailySkipCount,
    dailySkipLimit,
    selectedApplicationCount,
    skipForNow,
  } = useAccountabilityStore();
  const shieldedAppCount =
    selectedApplicationCount || profile.softLockSelectedApplicationCount;
  const topSafePadding = Math.max(insets.top, 24);
  const bottomSafePadding = Math.max(insets.bottom, 24);
  const requiredTotalMl = activeShield?.requiredAmountMl ?? progress.loggedMl + quickLogMl;
  const amountToLogMl = Math.max(requiredTotalMl - progress.loggedMl, quickLogMl);
  const skipsRemaining = Math.max(dailySkipLimit - dailySkipCount, 0);
  const refreshAccessibilityStatus = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return;
    }

    setAccessibilityEnabled(await isAccessibilityServiceEnabled());
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
      <View style={styles.cyanBlock} />
      <Card mode="contained" style={styles.card}>
        <Card.Content style={styles.content}>
          <View style={styles.powerButton}>
            <Text style={styles.powerIcon} variant="headlineLarge">
              0
            </Text>
          </View>
          <Text style={styles.kicker} variant="labelLarge">
            Soft lock active
          </Text>
          <Text style={styles.title} variant="headlineSmall">
            Hydration check-in
          </Text>
          <Text style={styles.subtitle} variant="bodyLarge">
            Drink and log your water to continue.
          </Text>
          {shieldedAppCount > 0 ? (
            <View style={styles.shieldPanel}>
              <Text style={styles.panelLabel}>Shielded selection</Text>
              <Text style={styles.panelValue}>{shieldedAppCount} apps, categories, or domains</Text>
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
            onPress={() => {
              logWater(amountToLogMl);
              router.replace('/(tabs)');
            }}
          >
            Log {amountToLogMl} ml and continue
          </Button>
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
  cyanBlock: {
    position: 'absolute',
    right: -60,
    bottom: -40,
    width: 220,
    height: 170,
    borderTopLeftRadius: 44,
    backgroundColor: colors.cyan,
    opacity: 0.9,
  },
  card: {
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    backgroundColor: colors.midnight,
    ...shadow,
  },
  content: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  powerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 118,
    height: 118,
    borderColor: colors.cyanSoft,
    borderRadius: 59,
    borderWidth: 2,
    backgroundColor: colors.cyan,
    ...shadow,
  },
  powerIcon: {
    color: colors.text,
    ...typography.h1,
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
