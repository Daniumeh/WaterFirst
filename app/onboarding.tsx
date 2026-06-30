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

import { signUpWithProfile } from '@/src/features/auth/authService';
import { calculateDailyGoalMl, generateCheckpoints } from '@/src/features/hydration/hydrationMath';
import { saveOnboardingPlan } from '@/src/features/hydration/hydrationRepository';
import type { ActivityLevel, Climate, UnitPreference } from '@/src/features/hydration/types';
import { useHydrationStore } from '@/src/store/hydrationStore';
import { useProfileStore } from '@/src/store/profileStore';
import { colors, glassShadow, radius, spacing, type } from '@/src/theme/tokens';

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
    helper: 'Start with the basics HydraLock needs to save your plan.',
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
    helper: 'Review the plan and choose how HydraLock may nudge you.',
  },
];

export default function OnboardingScreen() {
  const { profile, completeOnboarding } = useProfileStore();
  const { setGoal, setCheckpoints } = useHydrationStore();
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState(profile.firstName || profile.name);
  const [lastName, setLastName] = useState(profile.lastName);
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
  const emailLooksValid = /^\S+@\S+\.\S+$/.test(email.trim());
  const passwordLooksValid = password.length >= 8;
  const passwordsMatch = password === confirmPassword;
  const canContinue =
    (step === 0 &&
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      emailLooksValid &&
      passwordLooksValid &&
      passwordsMatch) ||
    (step === 1 && Number(weight) > 0 && wakeTime.trim().length > 0 && sleepTime.trim().length > 0) ||
    (step === 2 && activityDescription.trim().length >= 12) ||
    (step === 3 && softLockConsent);

  const activatePlan = async () => {
    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const savedProfile = {
      name: `${cleanFirstName} ${cleanLastName}`.trim(),
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

      completeOnboarding(savedProfile);
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
      <ScrollView contentContainerStyle={styles.container} showsHorizontalScrollIndicator={false}>
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
            HydraLock
          </Text>
          <Text style={styles.subtitle} variant="bodyLarge">
            A guided lock setup for hydration accountability.
          </Text>
          <Button mode="text" textColor={colors.cyanSoft} onPress={() => router.push('./sign-in')}>
            Already have an account? Sign in
          </Button>
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
                label="First name"
                mode="outlined"
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
              />
              <TextInput
                label="Last name"
                mode="outlined"
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
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
              {!softLockConsent ? (
                <Text style={styles.warning}>Soft-lock consent is required to activate HydraLock.</Text>
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
            {step === steps.length - 1 ? 'Activate HydraLock' : 'Continue'}
          </Button>
        </View>
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
    gap: spacing.lg,
    padding: spacing.lg,
    paddingTop: spacing.xxl,
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
    letterSpacing: 0,
  },
  title: {
    color: colors.text,
    fontFamily: type.data,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
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
    fontWeight: '800',
  },
  stepTitle: {
    color: colors.text,
    fontWeight: '800',
  },
  stepHelper: {
    color: colors.muted,
    lineHeight: 21,
  },
  fieldStack: {
    gap: spacing.md,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  sectionLabel: {
    color: colors.muted,
  },
  input: {
    backgroundColor: colors.panel,
  },
  textArea: {
    minHeight: 132,
  },
  warning: {
    color: colors.orange,
  },
  success: {
    color: colors.green,
    fontWeight: '700',
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
    fontFamily: type.data,
    fontWeight: '800',
    textAlign: 'center',
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
});
