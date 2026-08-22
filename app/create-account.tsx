import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { signUpWithProfile } from '@/src/features/auth/authService';
import { saveOnboardingPlan } from '@/src/features/hydration/hydrationRepository';
import {
  cancelReminderNotifications,
  scheduleCheckpointReminders,
} from '@/src/features/reminders/reminderService';
import { hasSupabaseConfig } from '@/src/lib/supabase';
import { useAccountabilityStore } from '@/src/store/accountabilityStore';
import { useHydrationStore } from '@/src/store/hydrationStore';
import { useProfileStore } from '@/src/store/profileStore';
import { useReminderStore } from '@/src/store/reminderStore';
import { colors, radius, spacing, typography } from '@/src/theme/tokens';

const waterfirstLogoDrop = require('../assets/images/waterfirst-logo-drop-v2.png');

function splitName(name: string) {
  const cleanName = name.trim() || 'WaterFirst User';
  const [firstName = '', ...remainingNames] = cleanName.split(/\s+/);

  return {
    cleanName,
    firstName,
    lastName: remainingNames.join(' '),
  };
}

function isExistingAccountError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return message.includes('already') || message.includes('registered') || message.includes('exists');
}

export default function CreateAccountScreen() {
  const insets = useSafeAreaInsets();
  const pendingPlan = useProfileStore((state) => state.pendingOnboardingPlan);
  const profile = useProfileStore((state) => state.profile);
  const completeOnboarding = useProfileStore((state) => state.completeOnboarding);
  const updateProfile = useProfileStore((state) => state.updateProfile);
  const setCheckpoints = useHydrationStore((state) => state.setCheckpoints);
  const setGoal = useHydrationStore((state) => state.setGoal);
  const logWater = useHydrationStore((state) => state.logWater);
  const setProtectedApps = useAccountabilityStore((state) => state.setProtectedApps);
  const setHydrationShieldPermissionStatus = useAccountabilityStore(
    (state) => state.setHydrationShieldPermissionStatus,
  );
  const setPermissionState = useReminderStore((state) => state.setPermissionState);
  const setScheduledNotificationIds = useReminderStore((state) => state.setScheduledNotificationIds);
  const updateReminderSettings = useReminderStore((state) => state.updateSettings);
  const [name, setName] = useState(pendingPlan?.profile.name || profile.name || '');
  const [email, setEmail] = useState(profile.email || pendingPlan?.profile.email || '');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingPlan && !isSubmitting) {
      router.replace('/onboarding' as never);
    }
  }, [isSubmitting, pendingPlan]);

  const topSafePadding = Math.max(insets.top + spacing.xl, spacing.xxl);
  const bottomSafePadding = Math.max(insets.bottom, Platform.OS === 'android' ? 72 : 24);
  const cleanEmail = email.trim().toLowerCase();
  const canSubmit =
    Boolean(pendingPlan) &&
    hasSupabaseConfig &&
    name.trim().length > 1 &&
    /^\S+@\S+\.\S+$/.test(cleanEmail) &&
    password.length >= 8;

  const handleCreateAccount = async () => {
    if (!pendingPlan) {
      router.replace('/onboarding' as never);
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const { cleanName, firstName, lastName } = splitName(name);
    const completedProfile = {
      ...pendingPlan.profile,
      email: cleanEmail,
      firstName,
      lastName,
      name: cleanName,
      onboardingComplete: true,
    };

    try {
      const result = await signUpWithProfile({
        appPackageNames: pendingPlan.appPackageNames,
        email: cleanEmail,
        password,
        profile: completedProfile,
        selectedAppIds: pendingPlan.selectedAppIds,
      });

      if (result.needsEmailConfirmation || !result.session?.user) {
        setMessage('Check your email to confirm your account, then sign in to finish saving your plan.');
        return;
      }

      setGoal(pendingPlan.goal);
      setCheckpoints(pendingPlan.checkpoints);
      setProtectedApps(pendingPlan.selectedAppIds, pendingPlan.appPackageNames);
      setHydrationShieldPermissionStatus(completedProfile.softLockConsent ? 'enabled' : 'disabled');

      if (completedProfile.notificationConsent) {
        try {
          const scheduled = await scheduleCheckpointReminders({
            checkpoints: pendingPlan.checkpoints,
            enabled: true,
          });
          setPermissionState('granted');
          setScheduledNotificationIds(scheduled.map((reminder) => reminder.notificationId));
          updateReminderSettings({
            activeEnd: completedProfile.sleepTime,
            activeStart: completedProfile.wakeTime,
            enabled: true,
          });
        } catch (error) {
          const reminderMessage =
            error instanceof Error
              ? error.message
              : 'Notification permission is needed before WaterFirst can send reminders.';
          setPermissionState('denied', reminderMessage);
          setScheduledNotificationIds([]);
          updateReminderSettings({
            activeEnd: completedProfile.sleepTime,
            activeStart: completedProfile.wakeTime,
            enabled: false,
          });
        }
      } else {
        await cancelReminderNotifications([]);
        setScheduledNotificationIds([]);
        updateReminderSettings({
          activeEnd: completedProfile.sleepTime,
          activeStart: completedProfile.wakeTime,
          enabled: false,
        });
      }

      await saveOnboardingPlan({
        checkpoints: pendingPlan.checkpoints,
        goal: pendingPlan.goal,
        profile: completedProfile,
      });

      if (pendingPlan.firstLogMl > 0) {
        logWater(pendingPlan.firstLogMl);
      }

      completeOnboarding(completedProfile);
      router.replace('/(tabs)' as never);
    } catch (error) {
      if (isExistingAccountError(error)) {
        updateProfile({ email: cleanEmail, name: cleanName });
        router.replace('/sign-in' as never);
        return;
      }

      setMessage(error instanceof Error ? error.message : 'Could not create your account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboard}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingBottom: bottomSafePadding,
            paddingTop: topSafePadding,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.accountPanel}>
          <View style={styles.header}>
            <View style={styles.dropMark}>
              <Image
                accessibilityIgnoresInvertColors
                accessibilityLabel="WaterFirst logo"
                resizeMode="contain"
                source={waterfirstLogoDrop}
                style={styles.logoImage}
              />
            </View>
            <Text style={styles.title}>Save your hydration plan</Text>
            <Text style={styles.subtitle}>
              Create an account to keep your progress, reminders, and water history safe across devices.
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Name"
              mode="outlined"
              onChangeText={setName}
              outlineColor={colors.line}
              activeOutlineColor={waterFirstBlue}
              textColor={colors.text}
              theme={textInputTheme}
              style={styles.input}
              value={name}
            />
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              label="Email"
              mode="outlined"
              onChangeText={setEmail}
              outlineColor={colors.line}
              activeOutlineColor={waterFirstBlue}
              textColor={colors.text}
              theme={textInputTheme}
              style={styles.input}
              value={email}
            />
            <TextInput
              label="Password"
              mode="outlined"
              onChangeText={setPassword}
              outlineColor={colors.line}
              activeOutlineColor={waterFirstBlue}
              right={
                <TextInput.Icon
                  color={colors.muted}
                  forceTextInputFocus={false}
                  icon={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                  onPress={() => setIsPasswordVisible((current) => !current)}
                />
              }
              secureTextEntry={!isPasswordVisible}
              textColor={colors.text}
              theme={textInputTheme}
              style={styles.input}
              value={password}
            />
          </View>

          {!hasSupabaseConfig ? (
            <Text style={styles.message}>Supabase credentials are required before account creation can work.</Text>
          ) : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <Button
            contentStyle={styles.buttonContent}
            disabled={!canSubmit || isSubmitting}
            loading={isSubmitting}
            labelStyle={styles.primaryButtonLabel}
            mode="contained"
            onPress={() => void handleCreateAccount()}
            style={styles.primaryButton}
          >
            Create Account
          </Button>

          <Button
            labelStyle={styles.secondaryButtonLabel}
            mode="text"
            onPress={() => router.replace('/sign-in' as never)}
            textColor={waterFirstBlue}
          >
            Already have an account? Sign in
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const waterFirstBlue = colors.cyan;
const accountBackground = colors.ink;
const textInputTheme = {
  colors: {
    background: colors.panel,
    onSurface: colors.text,
    onSurfaceVariant: colors.muted,
    primary: colors.cyan,
    surfaceVariant: colors.panel,
  },
};

const styles = StyleSheet.create({
  keyboard: {
    backgroundColor: accountBackground,
    flex: 1,
  },
  container: {
    backgroundColor: accountBackground,
    flexGrow: 1,
    gap: spacing.lg,
    justifyContent: 'center',
    maxWidth: 430,
    paddingHorizontal: spacing.xl,
    width: '100%',
    alignSelf: 'center',
  },
  accountPanel: {
    backgroundColor: colors.glassStrong,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.xl,
    gap: spacing.lg,
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    gap: spacing.md,
  },
  dropMark: {
    alignItems: 'center',
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  logoImage: {
    height: 84,
    width: 84,
  },
  title: {
    color: colors.text,
    ...typography.h1,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.muted,
    ...typography.body1,
    maxWidth: 330,
    textAlign: 'center',
  },
  form: {
    gap: spacing.md,
    width: '100%',
  },
  input: {
    backgroundColor: colors.panel,
  },
  message: {
    color: colors.orange,
    ...typography.body1,
    textAlign: 'center',
  },
  primaryButton: {
    alignSelf: 'center',
    backgroundColor: waterFirstBlue,
    borderRadius: radius.md,
    width: '100%',
  },
  primaryButtonLabel: {
    color: colors.ink,
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
  },
  secondaryButtonLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  buttonContent: {
    minHeight: 54,
  },
});
