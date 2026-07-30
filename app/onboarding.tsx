import { Redirect, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Checkbox,
  ProgressBar,
  SegmentedButtons,
  Text,
  TextInput,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  getSoftLockStatus,
  presentSoftLockApplicationPicker,
  requestSoftLockAuthorization,
  type SoftLockAdapterStatus,
} from '@/src/features/accountability/nativeSoftLockAdapter';
import { signUpWithProfile } from '@/src/features/auth/authService';
import { calculateDailyGoalMl, generateCheckpoints } from '@/src/features/hydration/hydrationMath';
import { saveOnboardingPlan } from '@/src/features/hydration/hydrationRepository';
import type { ActivityLevel, Climate, UnitPreference } from '@/src/features/hydration/types';
import { scheduleCheckpointReminders } from '@/src/features/reminders/reminderService';
import { useAccountabilityStore } from '@/src/store/accountabilityStore';
import { useHydrationStore } from '@/src/store/hydrationStore';
import { useProfileStore } from '@/src/store/profileStore';
import { useReminderStore } from '@/src/store/reminderStore';
import { colors, glassShadow, radius, spacing, typography } from '@/src/theme/tokens';

const activityOptions: { label: string; value: ActivityLevel }[] = [
  { label: 'Light', value: 'light' },
  { label: 'Moderate', value: 'moderate' },
  { label: 'High', value: 'high' },
];

const climateOptions: { label: string; value: Climate }[] = [
  { label: 'Cool', value: 'cool' },
  { label: 'Temperate', value: 'temperate' },
  { label: 'Hot', value: 'hot' },
];

const steps = [
  {
    eyebrow: 'Step 1 of 4',
    title: 'Create your WaterFirst profile',
    helper: 'Start with the basics WaterFirst needs to save your plan.',
  },
  {
    eyebrow: 'Step 2 of 4',
    title: 'Set your hydration baseline',
    helper: 'Weight and active hours shape the checkpoints.',
  },
  {
    eyebrow: 'Step 3 of 4',
    title: 'Describe your normal day',
    helper: 'A quick routine snapshot helps reminders feel less generic.',
  },
  {
    eyebrow: 'Step 4 of 4',
    title: 'Activate accountability',
    helper: 'Review the plan and choose how WaterFirst may nudge you.',
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { profile, completeOnboarding } = useProfileStore();
  const { setGoal, setCheckpoints } = useHydrationStore();
  const setSelectedApplicationCount = useAccountabilityStore((state) => state.setSelectedApplicationCount);
  const { setPermissionState, setScheduledNotificationIds, updateSettings } = useReminderStore();
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState(
    profile.name || [profile.firstName, profile.lastName].filter(Boolean).join(' '),
  );
  const [email, setEmail] = useState(profile.email);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [weight, setWeight] = useState(String(profile.weight));
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(profile.activityLevel);
  const [activityDescription, setActivityDescription] = useState(profile.activityDescription);
  const [climate, setClimate] = useState<Climate>(profile.climate);
  const [wakeTime, setWakeTime] = useState(profile.wakeTime);
  const [sleepTime, setSleepTime] = useState(profile.sleepTime);
  const [unitPreference, setUnitPreference] = useState<UnitPreference>(profile.unitPreference);
  const [notificationConsent, setNotificationConsent] = useState(profile.notificationConsent);
  const [softLockConsent, setSoftLockConsent] = useState(profile.softLockConsent);
  const [selectedApplicationCount, setSelectedApplicationCountState] = useState(
    profile.softLockSelectedApplicationCount,
  );
  const [softLockNativeStatus, setSoftLockNativeStatus] = useState<
    SoftLockAdapterStatus['authorizationStatus'] | null
  >(null);
  const [softLockRuntime, setSoftLockRuntime] = useState<SoftLockAdapterStatus['runtime'] | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const recommendedGoalMl = useMemo(
    () =>
      calculateDailyGoalMl({
        weight: Number(weight) || 0,
        unitPreference,
        activityLevel,
        climate,
      }),
    [activityLevel, climate, unitPreference, weight],
  );

  if (profile.onboardingComplete) {
    return <Redirect href="/(tabs)" />;
  }

  const activeStep = steps[step];
  const topSafePadding = Math.max(insets.top + spacing.lg, spacing.xxl);
  const bottomSafePadding = Math.max(insets.bottom, 24);
  const emailLooksValid = /^\S+@\S+\.\S+$/.test(email.trim());
  const passwordLooksValid = password.length >= 8;
  const passwordsMatch = password === confirmPassword;
  const canContinue =
    (step === 0 &&
      fullName.trim().length > 0 &&
      emailLooksValid &&
      passwordLooksValid &&
      passwordsMatch) ||
    (step === 1 && Number(weight) > 0 && wakeTime.trim().length > 0 && sleepTime.trim().length > 0) ||
    (step === 2 && activityDescription.trim().length >= 12) ||
    (step === 3 &&
      softLockConsent &&
      (selectedApplicationCount > 0 || softLockRuntime === 'androidPreview'));

  const handleRequestSoftLockAuthorization = async () => {
    setAuthError(null);
    const nativeStatus = await getSoftLockStatus();
    setSoftLockRuntime(nativeStatus.runtime);
    const status = await requestSoftLockAuthorization();
    setSoftLockNativeStatus(status);

    if (nativeStatus.runtime === 'androidPreview') {
      setAuthError(
        'Android Soft Lock preview is enabled. Waterfirst will run the hydration check-in flow, but it will not block other apps.',
      );
      return;
    }

    if (status !== 'approved') {
      setAuthError(
        status === 'unsupported'
          ? 'Actual app blocking requires the Waterfirst iOS development build.'
          : 'Screen Time permission is required before Waterfirst can shield apps.',
      );
    }
  };

  const handleChooseShieldedApps = async () => {
    setAuthError(null);

    try {
      const result = await presentSoftLockApplicationPicker();
      setSelectedApplicationCountState(result.selectedApplicationCount);
      setSelectedApplicationCount(result.selectedApplicationCount);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Could not open the native app picker.');
    }
  };

  const activatePlan = async () => {
    const cleanFullName = fullName.trim();
    const [cleanFirstName = '', ...remainingNames] = cleanFullName.split(/\s+/);
    const cleanLastName = remainingNames.join(' ');
    const savedProfile = {
      name: cleanFullName,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      email: email.trim().toLowerCase(),
      weight: Number(weight),
      activityLevel,
      activityDescription: activityDescription.trim(),
      climate,
      wakeTime,
      sleepTime,
      unitPreference,
      notificationConsent,
      softLockConsent,
      softLockSelectedApplicationCount: selectedApplicationCount,
      onboardingComplete: true,
    };
    const goal = {
      targetMl: recommendedGoalMl,
      manualOverrideMl: null,
      unitPreference,
    };
    const checkpoints = generateCheckpoints(recommendedGoalMl, wakeTime, sleepTime);

    setIsSubmitting(true);
    setAuthError(null);
    setAuthMessage(null);

    try {
      const result = await signUpWithProfile({
        email: savedProfile.email,
        password,
        profile: savedProfile,
      });

      if (savedProfile.notificationConsent) {
        try {
          const scheduledReminders = await scheduleCheckpointReminders({
            checkpoints,
            enabled: true,
          });
          setPermissionState('granted');
          setScheduledNotificationIds(
            scheduledReminders.map((reminder) => reminder.notificationId),
          );
          updateSettings({
            activeEnd: sleepTime,
            activeStart: wakeTime,
            enabled: true,
          });
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : 'Hydration reminders need notification access. You can enable notifications in your device settings and try again.';
          setPermissionState('denied', message);
          setAuthError(message);
          setIsSubmitting(false);
          return;
        }
      } else {
        setScheduledNotificationIds([]);
        updateSettings({
          activeEnd: sleepTime,
          activeStart: wakeTime,
          enabled: false,
        });
      }

      completeOnboarding(savedProfile);
      setSelectedApplicationCount(savedProfile.softLockSelectedApplicationCount);
      setGoal(goal);
      setCheckpoints(checkpoints);

      if (result.session) {
        await saveOnboardingPlan({
          checkpoints,
          goal,
          profile: savedProfile,
        });
        setAuthMessage('Account created and hydration plan synced.');
      } else if (result.needsEmailConfirmation) {
        setAuthMessage('Account created. Check your email to confirm your session.');
      } else {
        setAuthMessage('Hydration plan saved locally. Supabase config is not available.');
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Could not create your account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboard}
    >
      <View style={styles.reservoirBand} />
      <View style={styles.waterline} />
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingBottom: bottomSafePadding,
            paddingTop: topSafePadding,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerCard}>
          <View style={styles.logoMark}>
            <View style={styles.logoBarVertical} />
            <View style={styles.logoBarHorizontal} />
            <View style={styles.logoDot} />
          </View>
          <Text style={styles.kicker} variant="labelLarge">
            WaterFirst
          </Text>
          <Text style={styles.title} variant="displaySmall">
            WaterFirst
          </Text>
          <Text style={styles.subtitle} variant="bodyLarge">
            A guided lock setup for hydration accountability.
          </Text>
          <ProgressBar color={colors.cyan} progress={(step + 1) / steps.length} style={styles.progress} />
        </View>

        <View style={styles.stepCard}>
          <Text style={styles.stepEyebrow} variant="labelLarge">
            {activeStep.eyebrow}
          </Text>
          <Text style={styles.stepTitle} variant="headlineSmall">
            {activeStep.title}
          </Text>
          <Text style={styles.stepHelper}>{activeStep.helper}</Text>

          {step === 0 ? (
            <View style={styles.fieldStack}>
              <TextInput
                label="Full name"
                mode="outlined"
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
              />
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                label="Email"
                mode="outlined"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
              />
              <TextInput
                label="Password"
                mode="outlined"
                secureTextEntry
                style={styles.input}
                value={password}
                onChangeText={setPassword}
              />
              <TextInput
                label="Confirm password"
                mode="outlined"
                secureTextEntry
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              {email.length > 0 && !emailLooksValid ? (
                <Text style={styles.warning}>Enter a valid email to continue.</Text>
              ) : null}
              {password.length > 0 && !passwordLooksValid ? (
                <Text style={styles.warning}>Use at least 8 characters for your password.</Text>
              ) : null}
              {confirmPassword.length > 0 && !passwordsMatch ? (
                <Text style={styles.warning}>Passwords must match.</Text>
              ) : null}
            </View>
          ) : null}

          {step === 1 ? (
            <View style={styles.fieldStack}>
              <TextInput
                keyboardType="numeric"
                label={`Weight (${unitPreference === 'imperial' ? 'lb' : 'kg'})`}
                mode="outlined"
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
              />
              <View style={styles.fieldGroup}>
                <Text style={styles.sectionLabel} variant="labelLarge">
                  Units
                </Text>
                <SegmentedButtons
                  value={unitPreference}
                  onValueChange={(value) => setUnitPreference(value as UnitPreference)}
                  buttons={[
                    { label: 'oz', value: 'imperial' },
                    { label: 'ml', value: 'metric' },
                  ]}
                />
              </View>
              <View style={styles.timeRow}>
                <TextInput
                  label="Wake"
                  mode="outlined"
                  style={[styles.input, styles.timeInput]}
                  value={wakeTime}
                  onChangeText={setWakeTime}
                />
                <TextInput
                  label="Sleep"
                  mode="outlined"
                  style={[styles.input, styles.timeInput]}
                  value={sleepTime}
                  onChangeText={setSleepTime}
                />
              </View>
            </View>
          ) : null}

          {step === 2 ? (
            <View style={styles.fieldStack}>
              <TextInput
                label="What do your daily activities look like?"
                mode="outlined"
                multiline
                numberOfLines={5}
                style={[styles.input, styles.textArea]}
                value={activityDescription}
                onChangeText={setActivityDescription}
                placeholder="Work, classes, workouts, commute, caffeine habits..."
              />
              <View style={styles.fieldGroup}>
                <Text style={styles.sectionLabel} variant="labelLarge">
                  Activity level
                </Text>
                <SegmentedButtons
                  value={activityLevel}
                  onValueChange={(value) => setActivityLevel(value as ActivityLevel)}
                  buttons={activityOptions}
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.sectionLabel} variant="labelLarge">
                  Climate
                </Text>
                <SegmentedButtons
                  value={climate}
                  onValueChange={(value) => setClimate(value as Climate)}
                  buttons={climateOptions}
                />
              </View>
              {activityDescription.length > 0 && activityDescription.trim().length < 12 ? (
                <Text style={styles.warning}>Add a little more detail about your routine.</Text>
              ) : null}
            </View>
          ) : null}

          {step === 3 ? (
            <View style={styles.fieldStack}>
              <View style={styles.goalPreview}>
                <Text style={styles.sectionLabel} variant="labelLarge">
                  Recommended daily goal
                </Text>
                <Text style={styles.goalText} variant="headlineMedium">
                  {recommendedGoalMl} ml
                </Text>
                <Text style={styles.subtitle}>Checkpoints will be spread across {wakeTime}-{sleepTime}.</Text>
              </View>
              <ConsentRow
                checked={notificationConsent}
                label="I consent to hydration reminders and notification prompts."
                onPress={() => setNotificationConsent((value) => !value)}
              />
              <ConsentRow
                checked={softLockConsent}
                label="I consent to soft-lock accountability nudges when I miss checkpoints."
                onPress={() => setSoftLockConsent((value) => !value)}
              />
              <View style={styles.fieldGroup}>
                <Text style={styles.sectionLabel} variant="labelLarge">
                  Shield distracting apps
                </Text>
                <Text style={styles.stepHelper}>
                  Waterfirst uses Apple protected picker. App tokens stay on this device and are
                  not uploaded to Supabase.
                </Text>
                <View style={styles.nativePickerCard}>
                  <Text style={styles.nativePickerValue}>
                    {selectedApplicationCount} apps, categories, or domains selected
                  </Text>
                  {softLockNativeStatus ? (
                    <Text style={styles.stepHelper}>Screen Time status: {softLockNativeStatus}</Text>
                  ) : null}
                  {softLockRuntime === 'androidPreview' ? (
                    <Text style={styles.stepHelper}>
                      Android preview mode: external apps are not restricted.
                    </Text>
                  ) : null}
                  <View style={styles.nativePickerActions}>
                    <Button mode="outlined" textColor={colors.cyanSoft} onPress={() => void handleRequestSoftLockAuthorization()}>
                      Request permission
                    </Button>
                    <Button mode="contained" style={styles.nativePickerButton} onPress={() => void handleChooseShieldedApps()}>
                      Choose apps
                    </Button>
                  </View>
                </View>
              </View>
              {!softLockConsent ? (
                <Text style={styles.warning}>Soft-lock consent is required to activate WaterFirst.</Text>
              ) : null}
              {softLockConsent && selectedApplicationCount === 0 && softLockRuntime !== 'androidPreview' ? (
                <Text style={styles.warning}>Choose at least one app with Apple native picker.</Text>
              ) : null}
              {authError ? <Text style={styles.warning}>{authError}</Text> : null}
              {authMessage ? <Text style={styles.success}>{authMessage}</Text> : null}
            </View>
          ) : null}
        </View>

        <View style={styles.actions}>
          <Button
            disabled={step === 0}
            mode="outlined"
            textColor={colors.cyanSoft}
            onPress={() => setStep((value) => Math.max(value - 1, 0))}
            style={styles.secondaryButton}
          >
            Back
          </Button>
          <Button
            disabled={isSubmitting || !canContinue}
            loading={isSubmitting}
            mode="contained"
            onPress={() => {
              if (step === steps.length - 1) {
                void activatePlan();
                return;
              }

              setStep((value) => Math.min(value + 1, steps.length - 1));
            }}
            style={styles.primaryButton}
            contentStyle={styles.buttonContent}
          >
            {step === steps.length - 1 ? 'Activate WaterFirst' : 'Continue'}
          </Button>
        </View>
        <Button
          mode="text"
          textColor={colors.cyanSoft}
          onPress={() => router.push('./sign-in')}
          style={styles.signInButton}
        >
          Already have an account? Sign in
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type ConsentRowProps = {
  checked: boolean;
  label: string;
  onPress: () => void;
};

function ConsentRow({ checked, label, onPress }: ConsentRowProps) {
  return (
    <Button mode="contained-tonal" onPress={onPress} style={styles.consentRow}>
      <View style={styles.consentInner}>
        <Checkbox status={checked ? 'checked' : 'unchecked'} color={colors.cyan} />
        <Text style={styles.consentText}>{label}</Text>
      </View>
    </Button>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  glow: {
    display: 'none',
  },
  reservoirBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 110,
    height: 110,
    backgroundColor: 'rgba(20, 125, 255, 0.12)',
  },
  waterline: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    top: 86,
    height: 1,
    backgroundColor: colors.line,
  },
  container: {
    flexGrow: 1,
    gap: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.ink,
  },
  headerCard: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xl,
    backgroundColor: colors.glass,
    ...glassShadow,
  },
  logoMark: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 74,
    height: 74,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: 'rgba(3, 16, 28, 0.7)',
  },
  logoBarVertical: {
    position: 'absolute',
    width: 8,
    height: 46,
    borderRadius: 4,
    backgroundColor: colors.cyan,
    transform: [{ rotate: '45deg' }],
  },
  logoBarHorizontal: {
    position: 'absolute',
    width: 46,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.cyanSoft,
    transform: [{ rotate: '45deg' }],
  },
  logoDot: {
    position: 'absolute',
    right: 18,
    top: 17,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.orange,
  },
  kicker: {
    color: colors.cyan,
    ...typography.h2,
    letterSpacing: 0,
  },
  title: {
    color: colors.text,
    ...typography.h1,
  },
  subtitle: {
    color: colors.muted,
    ...typography.body1,
    textAlign: 'center',
  },
  progress: {
    alignSelf: 'stretch',
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.cardRaised,
    marginTop: spacing.md,
  },
  stepCard: {
    borderColor: colors.line,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.glass,
    ...glassShadow,
  },
  stepEyebrow: {
    color: colors.orange,
    ...typography.h2,
  },
  stepTitle: {
    color: colors.text,
    ...typography.h1,
  },
  stepHelper: {
    color: colors.muted,
    ...typography.body1,
  },
  fieldStack: {
    gap: spacing.md,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  sectionLabel: {
    color: colors.muted,
    ...typography.h2,
  },
  input: {
    backgroundColor: colors.panel,
  },
  textArea: {
    minHeight: 132,
  },
  warning: {
    color: colors.orange,
    ...typography.body1,
  },
  success: {
    color: colors.green,
    ...typography.h2,
  },
  goalPreview: {
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
    backgroundColor: colors.panel,
  },
  goalText: {
    color: colors.cyan,
    ...typography.h1,
    textAlign: 'center',
  },
  nativePickerCard: {
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.panel,
  },
  nativePickerValue: {
    color: colors.text,
    ...typography.h1,
  },
  nativePickerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  nativePickerButton: {
    backgroundColor: colors.cyan,
  },
  timeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  timeInput: {
    flexBasis: 120,
    flex: 1,
  },
  consentRow: {
    alignItems: 'stretch',
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.panel,
  },
  consentInner: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  consentText: {
    color: colors.text,
    ...typography.body1,
    flex: 1,
    textAlign: 'left',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  secondaryButton: {
    borderColor: colors.border,
    borderRadius: radius.md,
    flex: 1,
    minWidth: 92,
  },
  primaryButton: {
    borderRadius: radius.md,
    backgroundColor: colors.cyan,
    flex: 2,
    minWidth: 170,
  },
  buttonContent: {
    minHeight: 52,
  },
  signInButton: {
    alignSelf: 'center',
    marginTop: -spacing.sm,
  },
});
