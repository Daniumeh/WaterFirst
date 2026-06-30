import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Card, ProgressBar, Text } from 'react-native-paper';

import { addLocalMinutes, getDeviceNow } from '@/src/features/hydration/deviceTime';
import { useAccountabilityStore } from '@/src/store/accountabilityStore';
import { useHydrationStore } from '@/src/store/hydrationStore';
import { colors, radius, shadow, spacing } from '@/src/theme/tokens';

const quickLogMl = 250;

export default function SoftLockScreen() {
  const { progress, logWater } = useHydrationStore();
  const { recordOverride, snoozeUntil } = useAccountabilityStore();

  return (
    <View style={styles.container}>
      <View style={styles.cyanBlock} />
      <Card mode="contained" style={styles.card}>
        <Card.Content style={styles.content}>
          <View style={styles.powerButton}>
            <Text style={styles.powerIcon} variant="headlineLarge">
              0
            </Text>
          </View>
          <Text style={styles.kicker} variant="labelLarge">
            Soft-lock active
          </Text>
          <Text style={styles.title} variant="headlineSmall">
            HydraLock check-in
          </Text>
          <Text style={styles.subtitle} variant="bodyLarge">
            You missed a hydration checkpoint. Take a quick drink, snooze the nudge, or override it
            if your day needs flexibility.
          </Text>
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
              logWater(quickLogMl);
              router.replace('/(tabs)');
            }}
          >
            Log 250 ml
          </Button>
          <Button
            mode="outlined"
            textColor={colors.cyanSoft}
            onPress={() => {
              snoozeUntil(addLocalMinutes(getDeviceNow(), 30).toISOString());
              router.replace('/(tabs)');
            }}
          >
            Snooze 30 minutes
          </Button>
          <Button
            mode="text"
            textColor={colors.muted}
            onPress={() => {
              recordOverride();
              router.replace('/(tabs)');
            }}
          >
            Override for now
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontWeight: '800',
  },
  kicker: {
    color: colors.orange,
    fontWeight: '800',
  },
  title: {
    color: colors.text,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.muted,
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
});
