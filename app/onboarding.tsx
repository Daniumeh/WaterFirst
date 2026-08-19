import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Redirect, router } from 'expo-router';
import type { ComponentProps, Dispatch, ReactNode, SetStateAction } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput as NativeTextInput,
  View,
} from 'react-native';
import { Button, Checkbox, Switch, Text } from 'react-native-paper';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { mockProtectedApps } from '@/src/features/accountability/protectedApps';
import { requestReminderPermissions } from '@/src/features/reminders/reminderService';
import {
  DEFAULT_HYDRATION_CHECKPOINT_COUNT,
  generateCheckpoints,
} from '@/src/features/hydration/hydrationMath';
import type { ActivityLevel, Climate, HydrationCheckpoint, UnitPreference } from '@/src/features/hydration/types';
import { useProfileStore } from '@/src/store/profileStore';
import { useReminderStore } from '@/src/store/reminderStore';
import { radius, spacing, typography } from '@/src/theme/tokens';

const totalSteps = 23;
const transitionDurationMs = 320;
const splashAutoAdvanceMs = 2600;
const splashAppName = 'WaterFirst';
const onboardingCelebrationDrop = require('../assets/images/onboarding-celebration-drop.png');
const onboardingKidneyCutaway = require('../assets/images/onboarding-kidney-cutaway.png');
const onboardingHappyDrop = require('../assets/images/onboarding-happy-drop.png');
const onboardingSadKidneys = require('../assets/images/onboarding-sad-kidneys.png');
const onboardingWaterfirstKidneyBowl = require('../assets/images/onboarding-waterfirst-kidney-bowl.png');
const intakeOptions = ['less than 50cl', '50cl - 1L', '1 - 1.5L', '1.5 - 2L', 'more than 2L'];
type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const obstacleOptions: { id: string; icon: MaterialIconName; label: string }[] = [
  { id: 'forget', icon: 'timer-outline', label: 'I simply forget' },
  { id: 'distracted', icon: 'cellphone', label: 'I get distracted' },
  { id: 'thirsty', icon: 'water-off-outline', label: "I don't feel thirsty" },
  { id: 'avoid', icon: 'cup-off-outline', label: 'I avoid drinking too much' },
  { id: 'amount', icon: 'help-circle-outline', label: "I don't know how much I need" },
  { id: 'consistency', icon: 'calendar-sync-outline', label: 'I just struggle with consistency' },
];
const defaultObstacleIds = ['forget', 'distracted', 'consistency'];
const defaultSelectedAppIds = ['instagram', 'tiktok', 'x'];
const quickLogOptions = [
  { label: '+25cl', amountMl: 250 },
  { label: '+50cl', amountMl: 500 },
  { label: '+75cl', amountMl: 750 },
  { label: 'custom', amountMl: 0 },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { profile, setPendingOnboardingPlan } = useProfileStore();
  const setPermissionState = useReminderStore((state) => state.setPermissionState);
  const [stepIndex, setStepIndex] = useState(0);
  const [name, setName] = useState(profile.name || profile.firstName || 'Lebechi');
  const [weight, setWeight] = useState('70.0');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  const [dailyIntake, setDailyIntake] = useState('1 - 1.5L');
  const [obstacleIds, setObstacleIds] = useState<string[]>(defaultObstacleIds);
  const [wakeTime, setWakeTime] = useState('07:00');
  const [wakePeriod, setWakePeriod] = useState<'AM' | 'PM'>('AM');
  const [sleepTime, setSleepTime] = useState('10:30');
  const [sleepPeriod, setSleepPeriod] = useState<'AM' | 'PM'>('PM');
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [isRequestingNotificationPermission, setIsRequestingNotificationPermission] = useState(false);
  const [shieldEnabled, setShieldEnabled] = useState(false);
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>(defaultSelectedAppIds);
  const [firstLogMl, setFirstLogMl] = useState(250);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [transitionDirection, setTransitionDirection] = useState(1);
  const isTransitioningRef = useRef(false);

  const firstName = getFirstName(name);
  const wakeTime24 = toTwentyFourHourTime(wakeTime, wakePeriod);
  const sleepTime24 = toTwentyFourHourTime(sleepTime, sleepPeriod);
  const goalMl = useMemo(() => estimateStartingGoalMl(Number(weight), weightUnit), [weight, weightUnit]);
  const checkpoints = useMemo(
    () => generateCheckpoints(goalMl, wakeTime24, sleepTime24),
    [goalMl, sleepTime24, wakeTime24],
  );
  const selectedApps = useMemo(
    () => mockProtectedApps.filter((app) => selectedAppIds.includes(app.id)),
    [selectedAppIds],
  );

  useEffect(() => {
    if (profile.onboardingComplete || stepIndex !== 0) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      if (isTransitioningRef.current) {
        return;
      }

      isTransitioningRef.current = true;
      setSaveMessage(null);
      setTransitionDirection(1);
      setStepIndex(1);

      setTimeout(() => {
        isTransitioningRef.current = false;
      }, transitionDurationMs);
    }, splashAutoAdvanceMs);

    return () => clearTimeout(timeout);
  }, [profile.onboardingComplete, stepIndex]);

  if (profile.onboardingComplete) {
    return <Redirect href="/(tabs)" />;
  }

  const currentStep = stepIndex + 1;
  const bottomSafePadding = Math.max(insets.bottom, Platform.OS === 'android' ? 72 : 24);
  const topSafePadding = Math.max(insets.top, 16);

  const goNext = () => {
    if (isTransitioningRef.current) {
      return;
    }

    setSaveMessage(null);

    if (stepIndex >= totalSteps - 1) {
      prepareAccountCreation();
      return;
    }

    isTransitioningRef.current = true;
    setTransitionDirection(1);
    setStepIndex((value) => Math.min(value + 1, totalSteps - 1));
    setTimeout(() => {
      isTransitioningRef.current = false;
    }, transitionDurationMs);
  };

  const goToStep = (step: number) => {
    if (isTransitioningRef.current) {
      return;
    }

    setSaveMessage(null);
    isTransitioningRef.current = true;
    setTransitionDirection(step > currentStep ? 1 : -1);
    setStepIndex(Math.max(0, Math.min(step - 1, totalSteps - 1)));
    setTimeout(() => {
      isTransitioningRef.current = false;
    }, transitionDurationMs);
  };

  const requestNotificationsForHydrationFlow = async () => {
    if (isRequestingNotificationPermission) {
      return;
    }

    setIsRequestingNotificationPermission(true);
    setSaveMessage(null);

    try {
      const permission = await requestReminderPermissions();

      if (!permission.granted) {
        setRemindersEnabled(false);
        setPermissionState(
          permission.status,
          'Hydration reminders need notification access. You can enable notifications in your device settings and try again.',
        );
        setSaveMessage(
          'Notification access was not turned on. WaterFirst needs it to remind you before each water time.',
        );
        return;
      }

      setRemindersEnabled(true);
      setPermissionState(permission.status);
      setSaveMessage('Notifications are on. WaterFirst will remind you before each water time.');
    } catch (error) {
      setRemindersEnabled(false);
      setPermissionState(
        'denied',
        error instanceof Error
          ? error.message
          : 'Hydration reminders need notification access. You can enable notifications in your device settings and try again.',
      );
      setSaveMessage(
        error instanceof Error
          ? error.message
          : 'Notification access could not be turned on. Please try again.',
      );
    } finally {
      setIsRequestingNotificationPermission(false);
    }
  };

  const handleReminderToggle = (enabled: boolean) => {
    if (!enabled) {
      setRemindersEnabled(false);
      setSaveMessage('Notifications are off. You can continue and turn them on later.');
      return;
    }

    void requestNotificationsForHydrationFlow();
  };

  const handlePrimaryPress = () => {
    goNext();
  };

  const prepareAccountCreation = () => {
    const cleanName = name.trim() || 'WaterFirst User';
    const [firstNameValue = '', ...remainingNames] = cleanName.split(/\s+/);
    const appPackageNames = selectedApps.map((app) => app.packageName);
    const savedProfile = {
      name: cleanName,
      firstName: firstNameValue,
      lastName: remainingNames.join(' '),
      email: profile.email,
      weight: Number(weight) || 70,
      activityLevel: inferActivityLevel(obstacleIds),
      activityDescription: buildActivityDescription(dailyIntake, obstacleIds),
      climate: 'temperate' as Climate,
      wakeTime: wakeTime24,
      sleepTime: sleepTime24,
      unitPreference: (weightUnit === 'kg' ? 'metric' : 'imperial') as UnitPreference,
      notificationConsent: remindersEnabled,
      softLockConsent: shieldEnabled,
      softLockSelectedApplicationCount: shieldEnabled ? selectedApps.length : 0,
      onboardingComplete: true,
    };
    const goal = {
      manualOverrideMl: null,
      targetMl: goalMl,
      unitPreference: savedProfile.unitPreference,
    };

    setPendingOnboardingPlan({
      appPackageNames: shieldEnabled ? appPackageNames : [],
      checkpoints,
      firstLogMl,
      goal,
      profile: savedProfile,
      selectedAppIds: shieldEnabled ? selectedAppIds : [],
    });
    router.push('/create-account' as never);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboard}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          currentStep === 1 && styles.splashScrollContent,
          {
            paddingBottom: currentStep === 1 ? bottomSafePadding : bottomSafePadding + 96,
            paddingTop: topSafePadding,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        style={[styles.scroll, currentStep === 1 && styles.splashScroll]}
        showsVerticalScrollIndicator={false}
      >
        <StepShell currentStep={currentStep} direction={transitionDirection}>
          {renderStep({
            checkpoints,
            currentStep,
            dailyIntake,
            firstLogMl,
            firstName,
            goalMl,
            name,
            obstacleIds,
            isRequestingNotificationPermission,
            remindersEnabled,
            selectedAppIds,
            shieldEnabled,
            sleepPeriod,
            sleepTime,
            wakePeriod,
            wakeTime,
            weight,
            weightUnit,
            onDailyIntakeChange: setDailyIntake,
            onFirstLogChange: setFirstLogMl,
            onNameChange: setName,
            onObstacleToggle: (id) => toggleListValue(id, obstacleIds, setObstacleIds),
            onReminderToggle: handleReminderToggle,
            onSelectedAppToggle: (id) => toggleListValue(id, selectedAppIds, setSelectedAppIds),
            onShieldChange: setShieldEnabled,
            onSleepPeriodChange: setSleepPeriod,
            onSleepTimeChange: setSleepTime,
            onWakePeriodChange: setWakePeriod,
            onWakeTimeChange: setWakeTime,
            onWeightChange: setWeight,
            onWeightUnitChange: setWeightUnit,
          })}
        </StepShell>

        {saveMessage ? <Text style={styles.saveMessage}>{saveMessage}</Text> : null}
      </ScrollView>

      {currentStep !== 1 ? (
        <View style={[styles.bottomActions, { paddingBottom: bottomSafePadding }]}>
        {currentStep !== 1 ? (
          <AnimatedEntrance delay={180} entranceKey={`cta-${currentStep}`}>
            <AnimatedButton
              mode="contained"
              disabled={currentStep === 18 && isRequestingNotificationPermission}
              loading={currentStep === 18 && isRequestingNotificationPermission}
              onPress={handlePrimaryPress}
              style={styles.primaryButton}
              contentStyle={styles.primaryButtonContent}
              labelStyle={styles.primaryButtonLabel}
            >
              {getPrimaryLabel(currentStep)}
            </AnimatedButton>
          </AnimatedEntrance>
        ) : null}

        {currentStep === 18 ? (
          <Button mode="text" onPress={() => {
            setRemindersEnabled(false);
            goNext();
          }} textColor={mutedText}>
            maybe later
          </Button>
        ) : null}

        {currentStep === 19 ? (
          <Button mode="text" onPress={() => {
            setShieldEnabled(false);
            goToStep(21);
          }} textColor={mutedText}>
            maybe later
          </Button>
        ) : null}

        {currentStep === 6 ? (
          <Button
            mode="text"
            onPress={() => router.push('/sign-in' as never)}
            textColor={waterFirstBlue}
          >
            already have an account? sign in
          </Button>
        ) : null}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

type StepRenderProps = {
  checkpoints: HydrationCheckpoint[];
  currentStep: number;
  dailyIntake: string;
  firstLogMl: number;
  firstName: string;
  goalMl: number;
  isRequestingNotificationPermission: boolean;
  name: string;
  obstacleIds: string[];
  remindersEnabled: boolean;
  selectedAppIds: string[];
  shieldEnabled: boolean;
  sleepPeriod: 'AM' | 'PM';
  sleepTime: string;
  wakePeriod: 'AM' | 'PM';
  wakeTime: string;
  weight: string;
  weightUnit: 'kg' | 'lb';
  onDailyIntakeChange: (value: string) => void;
  onFirstLogChange: (value: number) => void;
  onNameChange: (value: string) => void;
  onObstacleToggle: (value: string) => void;
  onReminderToggle: (value: boolean) => void;
  onSelectedAppToggle: (value: string) => void;
  onShieldChange: (value: boolean) => void;
  onSleepPeriodChange: (value: 'AM' | 'PM') => void;
  onSleepTimeChange: (value: string) => void;
  onWakePeriodChange: (value: 'AM' | 'PM') => void;
  onWakeTimeChange: (value: string) => void;
  onWeightChange: (value: string) => void;
  onWeightUnitChange: (value: 'kg' | 'lb') => void;
};

function renderStep(props: StepRenderProps) {
  switch (props.currentStep) {
    case 1:
      return <SplashStep />;
    case 2:
      return (
        <StoryStep
          title={
            <>
              you remember{'\n'}to charge your phone,{'\n\n'}but forget to{' '}
              <Text style={styles.blueText}>drink water.</Text>
            </>
          }
          art={<PhoneKidneyArt />}
        />
      );
    case 3:
      return (
        <StoryStep
          title={
            <>
              {"the problem isn't"}{'\n'}knowing you should{'\n'}drink water.{'\n\n'}
              {"it's remembering to"}{' '}
              <Text style={styles.blueText}>actually do it.</Text>
            </>
          }
          art={<NotificationSwipeArt />}
        />
      );
    case 4:
      return (
        <StoryStep
          title={
            <>
              {"that's why we built"}{'\n'}
              <Text style={styles.blueText}>WaterFirst.</Text>
            </>
          }
          subtitle="a water reminder that's a little harder to ignore."
          art={<KidneyBowlArt />}
        />
      );
    case 5:
      return (
        <StoryStep
          title={
            <>
              {"when it's time to drink,"}{'\n'}
              <Text style={styles.blueText}>Hydration Shield</Text>
              {'\n'}gets your attention.
            </>
          }
          subtitle="your selected distracting apps can be restricted until you log your water."
          art={<ShieldFlowArt />}
        />
      );
    case 6:
      return (
        <QuestionStep title="let's make WaterFirst yours." helper="what should we call you?">
          <NativeTextInput
            autoCapitalize="words"
            onChangeText={props.onNameChange}
            placeholder="enter your name"
            placeholderTextColor="#9EAFC2"
            style={styles.textInput}
            value={props.name}
          />
        </QuestionStep>
      );
    case 7:
      return (
        <QuestionStep title="let's build your hydration goal." helper="what do you weigh?">
          <View style={styles.weightCard}>
            <NativeTextInput
              keyboardType="decimal-pad"
              onChangeText={props.onWeightChange}
              style={styles.weightInput}
              value={props.weight}
            />
            <Text style={styles.weightUnit}>{props.weightUnit}</Text>
            <MaterialCommunityIcons name="chevron-down" color={waterFirstBlue} size={18} />
          </View>
          <View style={styles.segmentRow}>
            {(['kg', 'lb'] as const).map((unit) => (
              <Pressable
                accessibilityRole="button"
                key={unit}
                onPress={() => props.onWeightUnitChange(unit)}
                style={[styles.segmentButton, props.weightUnit === unit && styles.segmentButtonActive]}
              >
                <Text style={[styles.segmentText, props.weightUnit === unit && styles.segmentTextActive]}>
                  {unit}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.helperText}>
            {"we'll use this to help personalize your daily water target."}
          </Text>
        </QuestionStep>
      );
    case 8:
      return (
        <QuestionStep title="be honest. how much water do you usually drink in a day?">
          <View style={styles.listCard}>
            {intakeOptions.map((option) => (
              <SelectableRow
                checked={props.dailyIntake === option}
                key={option}
                label={option}
                onPress={() => props.onDailyIntakeChange(option)}
                type="radio"
              />
            ))}
          </View>
        </QuestionStep>
      );
    case 9:
      return (
        <QuestionStep title="what usually gets in the way?" helper="(select all that apply)">
          <View style={styles.listCard}>
            {obstacleOptions.map((option) => (
              <SelectableRow
                checked={props.obstacleIds.includes(option.id)}
                icon={option.icon}
                key={option.id}
                label={option.label}
                onPress={() => props.onObstacleToggle(option.id)}
              />
            ))}
          </View>
        </QuestionStep>
      );
    case 10:
      return (
        <StoryStep
          title={
            <>
              {props.firstName}, {"your biggest hydration problem isn't water."}{'\n'}
              {"it's"}{' '}
              <Text style={styles.blueText}>consistency.</Text>
            </>
          }
          subtitle={"and that's exactly what we're going to help you build."}
          art={<SadKidneyArt />}
        />
      );
    case 11:
      return (
        <QuestionStep title="your starting daily goal">
          <AnimatedGoalText goalMl={props.goalMl} />
          <Text style={styles.helperText}>{getDailyGoalDrinkBreakdown(props.goalMl)}</Text>
          <CupRow count={DEFAULT_HYDRATION_CHECKPOINT_COUNT} />
          <Text style={styles.helperText}>You can adjust this goal anytime.</Text>
        </QuestionStep>
      );
    case 12:
      return (
        <StoryStep
          title={
            <>
              {'you don\'t need to become a "water person" overnight.'}
            </>
          }
          subtitle={
            <>
              <Text style={styles.blueText}>just drink the next one.</Text>
              {'\n\n'}WaterFirst helps turn those small drinks into a daily habit.
            </>
          }
          art={<HappyDropImageArt />}
        />
      );
    case 13:
      return (
        <QuestionStep title="imagine 30 days of actually hitting your water goal.">
          <MiniCalendar />
          <Text style={styles.streakText}>{'1 -> 3 -> 7 -> 14 -> 30'}</Text>
          <Text style={styles.helperText}>{"small drinks. repeated daily. that's the habit."}</Text>
        </QuestionStep>
      );
    case 14:
      return (
        <QuestionStep title="here's how WaterFirst keeps you on track.">
          <FeatureList />
        </QuestionStep>
      );
    case 15:
      return (
        <QuestionStep title="when does your day usually start?">
          <TimePickerCard
            period={props.wakePeriod}
            time={props.wakeTime}
            onPeriodChange={props.onWakePeriodChange}
            onTimeChange={props.onWakeTimeChange}
          />
          <Text style={styles.helperText}>{"we'll use this to schedule your first reminder."}</Text>
        </QuestionStep>
      );
    case 16:
      return (
        <QuestionStep title="when do you usually call it a day?">
          <TimePickerCard
            period={props.sleepPeriod}
            time={props.sleepTime}
            onPeriodChange={props.onSleepPeriodChange}
            onTimeChange={props.onSleepTimeChange}
          />
          <Text style={styles.helperText}>{"we'll spread your hydration reminders between these times."}</Text>
        </QuestionStep>
      );
    case 17:
      return (
        <QuestionStep title={`your hydration plan is ready, ${props.firstName}.`}>
          <SchedulePreview checkpoints={props.checkpoints} />
          <Text style={styles.blueFinePrint}>
            {formatLiters(props.goalMl)} by the end of your day
          </Text>
        </QuestionStep>
      );
    case 18:
      return (
        <StoryStep
          title={
            <>
              WaterFirst only works if we can remind you.
            </>
          }
          subtitle={
            props.remindersEnabled
              ? 'notifications are on. your water reminders will follow the schedule you created.'
              : "turn on notifications so WaterFirst can remind you before each water time."
          }
          art={
            <ReminderPermissionArt
              enabled={props.remindersEnabled}
              loading={props.isRequestingNotificationPermission}
              onToggle={props.onReminderToggle}
            />
          }
        />
      );
    case 19:
      return (
        <StoryStep
          title="want reminders that are harder to ignore?"
          subtitle="Hydration Shield can restrict the apps you choose when a hydration reminder becomes due. Log your water and your Shield clears."
          art={<DistractingAppsArt />}
          onToggle={() => props.onShieldChange(true)}
        />
      );
    case 20:
      return (
        <QuestionStep title="which apps distract you most?" helper="choose the apps you want Hydration Shield to protect.">
          <View style={styles.listCard}>
            {mockProtectedApps.slice(0, 6).map((app) => (
              <SelectableRow
                checked={props.selectedAppIds.includes(app.id)}
                icon={app.icon}
                iconColor={app.tint}
                key={app.id}
                label={app.name}
                onPress={() => props.onSelectedAppToggle(app.id)}
              />
            ))}
          </View>
        </QuestionStep>
      );
    case 21:
      return (
        <QuestionStep title="WaterFirst was built for people who are tired of forgetting.">
          <BenefitList />
        </QuestionStep>
      );
    case 22:
      return (
        <QuestionStep title={`one last thing, ${props.firstName}. let's start now.`} helper="have you had any water today?">
          <View style={styles.quickLogRow}>
            {quickLogOptions.map((option) => (
              <AnimatedTapTarget
                accessibilityRole="button"
                key={option.label}
                onPress={() => props.onFirstLogChange(option.amountMl)}
                style={[styles.quickPill, props.firstLogMl === option.amountMl && styles.quickPillActive]}
              >
                <Text style={[styles.quickText, props.firstLogMl === option.amountMl && styles.quickTextActive]}>
                  {option.label}
                </Text>
              </AnimatedTapTarget>
            ))}
          </View>
          <KidneyBowlArt compact />
          <WaterLoggedBurst burstKey={props.firstLogMl} />
          <Text style={styles.blueFinePrint}>
            {props.firstLogMl > 0 ? `${Math.round(props.firstLogMl / 10)}cl down. Keep going.` : 'no water logged yet.'}
          </Text>
        </QuestionStep>
      );
    default:
      return (
        <StoryStep
          title={
            <>
              <Text style={styles.blueText}>{"you're all set!"}</Text>
              {'\n'}your hydration journey starts now.
            </>
          }
          art={<CelebrationDropArt />}
        />
      );
  }
}

type StepShellProps = {
  children: ReactNode;
  currentStep: number;
  direction: number;
};

function StepShell({ children, currentStep, direction }: StepShellProps) {
  const reduceMotion = useReducedMotion();
  const pageProgress = useSharedValue(0);

  useEffect(() => {
    pageProgress.value = 0;
    pageProgress.value = withTiming(1, {
      duration: reduceMotion ? 120 : transitionDurationMs,
      easing: Easing.out(Easing.cubic),
    });
  }, [currentStep, pageProgress, reduceMotion]);

  const pageStyle = useAnimatedStyle(() => ({
    opacity: pageProgress.value,
    transform: [
      {
        translateX: reduceMotion ? 0 : interpolate(pageProgress.value, [0, 1], [direction * 25, 0]),
      },
    ],
  }));

  return (
    <View style={[styles.stepShell, currentStep === 1 && styles.splashShell]}>
      <Animated.View key={currentStep} style={[styles.animatedPage, pageStyle]}>
        {children}
      </Animated.View>
    </View>
  );
}

type AnimatedEntranceProps = {
  children: ReactNode;
  delay?: number;
  entranceKey?: string | number;
  scale?: boolean;
  style?: ComponentProps<typeof Animated.View>['style'];
};

function AnimatedEntrance({
  children,
  delay = 0,
  entranceKey,
  scale = false,
  style,
}: AnimatedEntranceProps) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      reduceMotion ? 0 : delay,
      withTiming(1, {
        duration: reduceMotion ? 120 : 300,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [delay, entranceKey, progress, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: reduceMotion ? 0 : interpolate(progress.value, [0, 1], [scale ? 12 : 16, 0]) },
      { scale: reduceMotion || !scale ? 1 : interpolate(progress.value, [0, 1], [0.96, 1]) },
    ],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

type AnimatedTapTargetProps = ComponentProps<typeof Pressable> & {
  disabled?: boolean;
};

function AnimatedTapTarget({ disabled, onPress, onPressIn, onPressOut, style, ...props }: AnimatedTapTargetProps) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      onPress={disabled ? undefined : onPress}
      onPressIn={(event) => {
        if (!disabled && !reduceMotion) {
          // eslint-disable-next-line react-hooks/immutability
          scale.value = withTiming(0.97, { duration: 110, easing: Easing.out(Easing.cubic) });
        }
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        if (!disabled && !reduceMotion) {
          // eslint-disable-next-line react-hooks/immutability
          scale.value = withTiming(1, { duration: 130, easing: Easing.out(Easing.cubic) });
        }
        onPressOut?.(event);
      }}
      style={[style, animatedStyle]}
    />
  );
}

function AnimatedButton({ disabled, loading, onPress, onPressIn, onPressOut, ...props }: ComponentProps<typeof Button>) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Button
        {...props}
        disabled={disabled}
        loading={loading}
        onPress={disabled || loading ? undefined : onPress}
        onPressIn={(event) => {
          if (!disabled && !loading && !reduceMotion) {
            // eslint-disable-next-line react-hooks/immutability
            scale.value = withTiming(0.97, { duration: 110, easing: Easing.out(Easing.cubic) });
          }
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          if (!disabled && !loading && !reduceMotion) {
            // eslint-disable-next-line react-hooks/immutability
            scale.value = withTiming(1, { duration: 130, easing: Easing.out(Easing.cubic) });
          }
          onPressOut?.(event);
        }}
      />
    </Animated.View>
  );
}

function SplashStep() {
  const reduceMotion = useReducedMotion();
  const dropletProgress = useSharedValue(0);

  useEffect(() => {
    dropletProgress.value = withDelay(
      reduceMotion ? 0 : 220,
      withTiming(1, { duration: reduceMotion ? 120 : 1650, easing: Easing.inOut(Easing.cubic) }),
    );
  }, [dropletProgress, reduceMotion]);

  const dropletStyle = useAnimatedStyle(() => ({
    opacity: interpolate(dropletProgress.value, [0, 0.12, 1], [0, 1, 1]),
    transform: [
      { translateY: reduceMotion ? 0 : interpolate(dropletProgress.value, [0, 1], [-190, 124]) },
      { scale: reduceMotion ? 1 : interpolate(dropletProgress.value, [0, 1], [0.7, 1]) },
    ],
  }));

  return (
    <View style={styles.splashContent}>
      <Animated.View style={[styles.splashDropIcon, dropletStyle]}>
        <MaterialCommunityIcons name="water" color="#FFFFFF" size={52} />
      </Animated.View>
      <AnimatedWritingTitle />
    </View>
  );
}

function AnimatedWritingTitle() {
  const reduceMotion = useReducedMotion();
  const cursorProgress = useSharedValue(0);
  const [visibleLength, setVisibleLength] = useState(0);
  const visibleName = reduceMotion ? splashAppName : splashAppName.slice(0, visibleLength);

  useEffect(() => {
    if (reduceMotion) {
      return undefined;
    }

    cursorProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }),
        withTiming(0.18, { duration: 320, easing: Easing.out(Easing.cubic) }),
      ),
      -1,
      true,
    );

    const timers = Array.from(splashAppName, (_, index) =>
      setTimeout(() => setVisibleLength(index + 1), 520 + index * 95),
    );

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [cursorProgress, reduceMotion]);

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion ? 0 : cursorProgress.value,
  }));

  return (
    <View accessibilityLabel={splashAppName} style={styles.splashWritingRow}>
      <Text style={styles.splashTitle}>{visibleName}</Text>
      <Animated.View style={[styles.splashCursor, cursorStyle]} />
    </View>
  );
}

type StoryStepProps = {
  art: ReactNode;
  onToggle?: () => void;
  subtitle?: ReactNode;
  title: ReactNode;
};

function StoryStep({ art, onToggle, subtitle, title }: StoryStepProps) {
  return (
    <View style={styles.storyWrap}>
      <AnimatedEntrance entranceKey="story-title">
        <Text style={styles.storyTitle}>{title}</Text>
      </AnimatedEntrance>
      {subtitle ? (
        <AnimatedEntrance delay={60} entranceKey="story-subtitle">
          <Text style={styles.storySubtitle}>{subtitle}</Text>
        </AnimatedEntrance>
      ) : null}
      <AnimatedEntrance delay={100} entranceKey="story-art" scale style={styles.fullWidth}>
        <Pressable accessibilityRole={onToggle ? 'button' : undefined} onPress={onToggle} style={styles.artWrap}>
          {art}
        </Pressable>
      </AnimatedEntrance>
    </View>
  );
}

type QuestionStepProps = {
  children: ReactNode;
  helper?: ReactNode;
  title: ReactNode;
};

function QuestionStep({ children, helper, title }: QuestionStepProps) {
  return (
    <View style={styles.questionWrap}>
      <AnimatedEntrance entranceKey="question-title">
        <Text style={styles.storyTitle}>{title}</Text>
      </AnimatedEntrance>
      {helper ? (
        <AnimatedEntrance delay={60} entranceKey="question-helper">
          <Text style={styles.storySubtitle}>{helper}</Text>
        </AnimatedEntrance>
      ) : null}
      <AnimatedEntrance delay={140} entranceKey="question-controls" style={styles.fullWidth}>
        <View style={styles.questionContent}>{children}</View>
      </AnimatedEntrance>
    </View>
  );
}

function PhoneKidneyArt() {
  const reduceMotion = useReducedMotion();
  const phoneProgress = useSharedValue(0);
  const batteryProgress = useSharedValue(0);
  const floatProgress = useSharedValue(0);

  useEffect(() => {
    phoneProgress.value = withTiming(1, {
      duration: reduceMotion ? 120 : 420,
      easing: Easing.out(Easing.cubic),
    });
    batteryProgress.value = withDelay(
      reduceMotion ? 0 : 160,
      withTiming(1, { duration: reduceMotion ? 120 : 760, easing: Easing.out(Easing.cubic) }),
    );
    if (!reduceMotion) {
      floatProgress.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.cubic) }),
          withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.cubic) }),
        ),
        -1,
        false,
      );
    }
  }, [batteryProgress, floatProgress, phoneProgress, reduceMotion]);

  const phoneStyle = useAnimatedStyle(() => ({
    opacity: phoneProgress.value,
    transform: [
      {
        translateY: reduceMotion
          ? 0
          : interpolate(phoneProgress.value, [0, 1], [22, 0]) +
            interpolate(floatProgress.value, [0, 1], [2, -4]),
      },
    ],
  }));
  const kidneyFloatStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: reduceMotion ? 0 : interpolate(floatProgress.value, [0, 1], [-4, 4]) },
      { rotate: reduceMotion ? '0deg' : `${interpolate(floatProgress.value, [0, 1], [-1.5, 1.5])}deg` },
    ],
  }));
  const batteryStyle = useAnimatedStyle(() => ({
    height: `${interpolate(batteryProgress.value, [0, 1], [10, 82])}%`,
  }));

  return (
    <View style={styles.sideArtRow}>
      <Animated.View style={[styles.onboardingArtSlot, phoneStyle]}>
        <View style={styles.phoneArt}>
          <View style={styles.phoneNotch} />
          <View style={styles.batteryOutline}>
            <Animated.View style={[styles.batteryFill, batteryStyle]} />
          </View>
          <Text style={styles.phoneText}>100%</Text>
        </View>
      </Animated.View>
      <AnimatedEntrance delay={120} scale>
        <Animated.View style={kidneyFloatStyle}>
          <Image
            accessibilityIgnoresInvertColors
            accessibilityLabel="Kidney with water reservoir"
            resizeMode="contain"
            source={onboardingKidneyCutaway}
            style={styles.onboardingKidneyImage}
          />
        </Animated.View>
      </AnimatedEntrance>
    </View>
  );
}

function NotificationSwipeArt() {
  const reduceMotion = useReducedMotion();
  const firstProgress = useSharedValue(0);
  const secondProgress = useSharedValue(0);
  const revealProgress = useSharedValue(0);

  useEffect(() => {
    firstProgress.value = withSequence(
      withTiming(1, { duration: reduceMotion ? 120 : 320, easing: Easing.out(Easing.cubic) }),
      withDelay(
        reduceMotion ? 0 : 450,
        withTiming(2, { duration: reduceMotion ? 120 : 360, easing: Easing.out(Easing.cubic) }),
      ),
    );
    secondProgress.value = withDelay(
      reduceMotion ? 80 : 900,
      withSequence(
        withTiming(1, { duration: reduceMotion ? 120 : 320, easing: Easing.out(Easing.cubic) }),
        withDelay(
          reduceMotion ? 0 : 450,
          withTiming(2, { duration: reduceMotion ? 120 : 360, easing: Easing.out(Easing.cubic) }),
        ),
      ),
    );
    revealProgress.value = withDelay(
      reduceMotion ? 120 : 1700,
      withTiming(1, { duration: reduceMotion ? 120 : 300, easing: Easing.out(Easing.cubic) }),
    );
  }, [firstProgress, reduceMotion, revealProgress, secondProgress]);

  const firstStyle = useNotificationDismissStyle(firstProgress, reduceMotion);
  const secondStyle = useNotificationDismissStyle(secondProgress, reduceMotion);
  const revealStyle = useAnimatedStyle(() => ({
    opacity: revealProgress.value,
    transform: [{ translateY: reduceMotion ? 0 : interpolate(revealProgress.value, [0, 1], [8, 0]) }],
  }));

  return (
    <View style={styles.notificationStack}>
      {[firstStyle, secondStyle].map((animatedStyle, item) => (
        <Animated.View key={item} style={[styles.notificationCard, animatedStyle]}>
          <MaterialCommunityIcons name="water-outline" color={waterFirstBlue} size={22} />
          <View style={{ flex: 1 }}>
            <Text style={styles.notificationTitle}>Time for water</Text>
            <Text style={styles.notificationBody}>25cl - now</Text>
          </View>
          <Text style={styles.notificationBody}>now</Text>
        </Animated.View>
      ))}
      <Animated.Text style={[styles.swipedText, revealStyle]}>swiped away</Animated.Text>
    </View>
  );
}

function useNotificationDismissStyle(progress: SharedValue<number>, reduceMotion: boolean) {
  return useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.2, 1, 2], [0, 1, 1, 0]),
    transform: [
      { translateX: reduceMotion ? 0 : interpolate(progress.value, [0, 1, 2], [28, 0, 90]) },
      { translateY: reduceMotion ? 0 : interpolate(progress.value, [0, 1, 2], [8, 0, -4]) },
    ],
  }));
}

function KidneyBowlArt({ compact }: { compact?: boolean }) {
  const reduceMotion = useReducedMotion();
  const floatProgress = useSharedValue(0);

  useEffect(() => {
    if (!reduceMotion) {
      floatProgress.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.cubic) }),
          withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.cubic) }),
        ),
        -1,
        false,
      );
    }
  }, [floatProgress, reduceMotion]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: reduceMotion ? 0 : interpolate(floatProgress.value, [0, 1], [-3, 3]) },
      { scale: compact ? 0.82 : 1 },
    ],
  }));

  return (
    <Animated.View style={[styles.kidneyBowl, floatStyle]}>
      <Image
        accessibilityIgnoresInvertColors
        accessibilityLabel="WaterFirst kidney hydration illustration"
        resizeMode="contain"
        source={onboardingWaterfirstKidneyBowl}
        style={styles.kidneyBowlImage}
      />
    </Animated.View>
  );
}

function ShieldFlowArt() {
  const reduceMotion = useReducedMotion();
  const demoProgress = useSharedValue(0);
  const items = [
    { icon: 'bell', label: 'time for water' },
    { icon: 'lock-outline', label: 'apps locked' },
    { icon: 'cup-water', label: 'water logged' },
    { icon: 'check-circle-outline', label: 'apps unlocked' },
  ] as const;

  useEffect(() => {
    demoProgress.value = reduceMotion
      ? withTiming(1, { duration: 120 })
      : withRepeat(
          withSequence(
            withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }),
            withTiming(2, { duration: 700, easing: Easing.out(Easing.cubic) }),
            withTiming(3, { duration: 700, easing: Easing.out(Easing.cubic) }),
            withTiming(4, { duration: 700, easing: Easing.out(Easing.cubic) }),
            withTiming(5, { duration: 700, easing: Easing.out(Easing.cubic) }),
            withDelay(900, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) })),
          ),
          -1,
          false,
        );
  }, [demoProgress, reduceMotion]);

  return (
    <View style={styles.flowRow}>
      {items.map((item, index) => (
        <ShieldFlowItem
          demoProgress={demoProgress}
          icon={item.icon}
          index={index}
          key={item.label}
          label={item.label}
        />
      ))}
    </View>
  );
}

function ShieldFlowItem({
  demoProgress,
  icon,
  index,
  label,
}: {
  demoProgress: SharedValue<number>;
  icon: MaterialIconName;
  index: number;
  label: string;
}) {
  const reduceMotion = useReducedMotion();
  const itemStyle = useAnimatedStyle(() => {
    const start = index + 0.25;
    const end = index + 1.15;
    const active = reduceMotion ? 1 : interpolate(demoProgress.value, [start, end], [0, 1], 'clamp');

    return {
      opacity: interpolate(active, [0, 1], [0.62, 1]),
      transform: [{ scale: interpolate(active, [0, 1], [0.95, 1.04]) }],
    };
  });

  return (
    <Animated.View style={[styles.flowItem, itemStyle]}>
      <View style={styles.flowIcon}>
        <MaterialCommunityIcons name={icon} color={index === 3 ? '#28C76F' : waterFirstBlue} size={28} />
        {index === 1 ? <MaterialCommunityIcons name="lock" color={waterFirstBlue} size={16} style={styles.flowLock} /> : null}
        {index === 2 ? <Text style={styles.flowAmount}>+25cl</Text> : null}
      </View>
      <Text style={styles.flowLabel}>{label}</Text>
    </Animated.View>
  );
}

function FloatingArt({
  amplitude = 5,
  children,
  delayMs = 0,
  durationMs = 1700,
  rotateDeg = 1.2,
}: {
  amplitude?: number;
  children: ReactNode;
  delayMs?: number;
  durationMs?: number;
  rotateDeg?: number;
}) {
  const reduceMotion = useReducedMotion();
  const floatProgress = useSharedValue(0);

  useEffect(() => {
    if (!reduceMotion) {
      floatProgress.value = withDelay(
        delayMs,
        withRepeat(
          withSequence(
            withTiming(1, { duration: durationMs, easing: Easing.inOut(Easing.cubic) }),
            withTiming(0, { duration: durationMs, easing: Easing.inOut(Easing.cubic) }),
          ),
          -1,
          false,
        ),
      );
    }
  }, [delayMs, durationMs, floatProgress, reduceMotion]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: reduceMotion ? 0 : interpolate(floatProgress.value, [0, 1], [-amplitude, amplitude]) },
      { rotate: reduceMotion ? '0deg' : `${interpolate(floatProgress.value, [0, 1], [-rotateDeg, rotateDeg])}deg` },
    ],
  }));

  return <Animated.View style={floatStyle}>{children}</Animated.View>;
}

function SadKidneyArt() {
  return (
    <FloatingArt amplitude={4} durationMs={1650} rotateDeg={0.9}>
      <Image
        accessibilityIgnoresInvertColors
        accessibilityLabel="Two low-water kidneys with a sad expression"
        resizeMode="contain"
        source={onboardingSadKidneys}
        style={styles.sadKidneyImage}
      />
    </FloatingArt>
  );
}

function HappyDropImageArt() {
  return (
    <FloatingArt amplitude={6} delayMs={120} durationMs={1750} rotateDeg={1.1}>
      <Image
        accessibilityIgnoresInvertColors
        accessibilityLabel="Happy water drop character"
        resizeMode="contain"
        source={onboardingHappyDrop}
        style={styles.happyDropImage}
      />
    </FloatingArt>
  );
}

function CelebrationDropArt() {
  return (
    <FloatingArt amplitude={7} delayMs={80} durationMs={1550} rotateDeg={1.4}>
      <Image
        accessibilityIgnoresInvertColors
        accessibilityLabel="Celebrating water drop character"
        resizeMode="contain"
        source={onboardingCelebrationDrop}
        style={styles.celebrationDropImage}
      />
    </FloatingArt>
  );
}

function ReminderPermissionArt({
  enabled,
  loading,
  onToggle,
}: {
  enabled: boolean;
  loading: boolean;
  onToggle: (value: boolean) => void;
}) {
  return (
    <View style={styles.reminderPermissionWrap}>
      <ReminderLockArt />
      <View style={styles.notificationToggleCard}>
        <View style={styles.notificationToggleIcon}>
          <MaterialCommunityIcons
            name={enabled ? 'bell-check-outline' : 'bell-ring-outline'}
            color={waterFirstBlue}
            size={24}
          />
        </View>
        <View style={styles.notificationToggleText}>
          <Text style={styles.notificationToggleTitle}>Notification reminders</Text>
          <Text style={styles.notificationToggleBody}>
            {enabled
              ? 'On. WaterFirst will remind you 15 minutes before each water time.'
              : 'Turn on reminders before each water time.'}
          </Text>
        </View>
        <Switch
          color={waterFirstBlue}
          disabled={loading}
          onValueChange={onToggle}
          value={enabled}
        />
      </View>
    </View>
  );
}

function ReminderLockArt() {
  const reduceMotion = useReducedMotion();
  const noticeProgress = useSharedValue(0);

  useEffect(() => {
    noticeProgress.value = withTiming(1, {
      duration: reduceMotion ? 120 : 420,
      easing: Easing.out(Easing.cubic),
    });
  }, [noticeProgress, reduceMotion]);

  const noticeStyle = useAnimatedStyle(() => ({
    opacity: noticeProgress.value,
    transform: [
      { translateY: reduceMotion ? 0 : interpolate(noticeProgress.value, [0, 1], [-18, 0]) },
      { scale: reduceMotion ? 1 : interpolate(noticeProgress.value, [0, 1], [0.96, 1]) },
    ],
  }));

  return (
    <View style={styles.reminderArt}>
      <Animated.View style={[styles.notificationCard, noticeStyle]}>
        <MaterialCommunityIcons name="water-outline" color={waterFirstBlue} size={22} />
        <View style={{ flex: 1 }}>
          <Text style={styles.notificationTitle}>WaterFirst</Text>
          <Text style={styles.notificationBody}>Time for water</Text>
        </View>
      </Animated.View>
      <View style={styles.lockScreen}>
        <MaterialCommunityIcons name="lock-outline" color="#FFFFFF" size={18} />
        <Text style={styles.lockTime}>09:30</Text>
        <Text style={styles.lockSub}>Thursday, August 9</Text>
      </View>
    </View>
  );
}

function DistractingAppsArt() {
  const reduceMotion = useReducedMotion();
  const lockProgress = useSharedValue(0);
  const apps = mockProtectedApps.slice(0, 3);

  useEffect(() => {
    lockProgress.value = reduceMotion
      ? withTiming(1, { duration: 120 })
      : withRepeat(
          withSequence(
            withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }),
            withDelay(850, withTiming(0, { duration: 520, easing: Easing.out(Easing.cubic) })),
          ),
          -1,
          false,
        );
  }, [lockProgress, reduceMotion]);

  const lockStyle = useAnimatedStyle(() => ({
    opacity: lockProgress.value,
    transform: [{ scale: interpolate(lockProgress.value, [0, 1], [0.7, 1]) }],
  }));

  return (
    <View style={styles.distractionArt}>
      {apps.map((app) => (
        <View key={app.id} style={styles.distractionIcon}>
          <MaterialCommunityIcons name={app.icon} color={app.tint} size={34} />
          <Animated.View style={[styles.smallLock, lockStyle]}>
            <MaterialCommunityIcons name="lock" color="#333D4D" size={12} />
          </Animated.View>
        </View>
      ))}
    </View>
  );
}

function FeatureList() {
  const features = [
    ['personal hydration goal', 'A daily target built around you and editable anytime.', 'target'],
    ['smart reminders', 'Water reminders spread throughout your day.', 'bell-outline'],
    ['Hydration Shield', 'Make selected distracting apps harder to access when it is time to drink.', 'shield-lock-outline'],
    ['watch your progress fill', 'Every drink moves your daily visual closer to full.', 'water-percent'],
  ] as const;

  return (
    <View style={styles.featureList}>
      {features.map(([title, body, icon]) => (
        <AnimatedEntrance delay={80 * features.findIndex(([featureTitle]) => featureTitle === title)} key={title}>
          <View style={styles.featureRow}>
            <MaterialCommunityIcons name={icon} color={waterFirstBlue} size={22} />
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>{title}</Text>
              <Text style={styles.featureBody}>{body}</Text>
            </View>
          </View>
        </AnimatedEntrance>
      ))}
    </View>
  );
}

function BenefitList() {
  const benefits = [
    ['simple enough to use every day', 'check-decagram-outline'],
    ['reminders built around your routine', 'alarm-check'],
    ["extra accountability when reminders aren't enough", 'shield-check-outline'],
  ] as const;

  return (
    <View style={styles.featureList}>
      {benefits.map(([label, icon]) => (
        <AnimatedEntrance delay={90 * benefits.findIndex(([benefitLabel]) => benefitLabel === label)} key={label}>
          <View style={styles.featureRow}>
            <MaterialCommunityIcons name={icon} color={waterFirstBlue} size={25} />
            <Text style={styles.featureTitle}>{label}</Text>
          </View>
        </AnimatedEntrance>
      ))}
    </View>
  );
}

function MiniCalendar() {
  return (
    <View style={styles.calendarGrid}>
      {Array.from({ length: 30 }, (_, index) => index + 1).map((day) => (
        <AnimatedEntrance delay={Math.min(day, 18) * 28} key={day} scale>
          <View style={[styles.calendarDay, day >= 14 && styles.calendarDayActive]}>
            <Text style={[styles.calendarText, day >= 14 && styles.calendarTextActive]}>{day}</Text>
          </View>
        </AnimatedEntrance>
      ))}
    </View>
  );
}

function CupRow({ count }: { count: number }) {
  return (
    <View style={styles.cupRow}>
      {Array.from({ length: count }, (_, index) => (
        <AnimatedEntrance delay={index * 45} key={index} scale>
          <MaterialCommunityIcons name="cup-water" color="#8EDAFF" size={25} />
        </AnimatedEntrance>
      ))}
    </View>
  );
}

function AnimatedGoalText({ goalMl }: { goalMl: number }) {
  const reduceMotion = useReducedMotion();
  const [displayMl, setDisplayMl] = useState(0);

  useEffect(() => {
    let frame = 0;
    const frames = reduceMotion ? 1 : 12;
    const interval = setInterval(() => {
      frame += 1;
      setDisplayMl(Math.round((goalMl * frame) / frames / 100) * 100);

      if (frame >= frames) {
        clearInterval(interval);
      }
    }, reduceMotion ? 0 : 60);

    return () => clearInterval(interval);
  }, [goalMl, reduceMotion]);

  return <Text style={styles.goalBig}>{formatLiters(displayMl)}</Text>;
}

function WaterLoggedBurst({ burstKey }: { burstKey: number }) {
  const reduceMotion = useReducedMotion();
  const burstProgress = useSharedValue(0);

  useEffect(() => {
    burstProgress.value = 0;
    burstProgress.value = withTiming(1, {
      duration: reduceMotion ? 120 : 720,
      easing: Easing.out(Easing.cubic),
    });
  }, [burstKey, burstProgress, reduceMotion]);

  return (
    <View pointerEvents="none" style={styles.burstWrap}>
      {Array.from({ length: 7 }, (_, index) => (
        <WaterDroplet key={`${burstKey}-${index}`} index={index} progress={burstProgress} />
      ))}
    </View>
  );
}

function WaterDroplet({ index, progress }: { index: number; progress: SharedValue<number> }) {
  const dropletStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.2, 1], [0, 0.8, 0]),
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [0, (index - 3) * 11]) },
      { translateY: interpolate(progress.value, [0, 1], [0, -42 - index * 3]) },
      { scale: interpolate(progress.value, [0, 1], [0.65, 1]) },
    ],
  }));

  return (
    <Animated.View style={[styles.burstDrop, dropletStyle]}>
      <MaterialCommunityIcons name="water" color="#38BDF8" size={12} />
    </Animated.View>
  );
}

type TimePickerCardProps = {
  onPeriodChange: (value: 'AM' | 'PM') => void;
  onTimeChange: (value: string) => void;
  period: 'AM' | 'PM';
  time: string;
};

function TimePickerCard({ onPeriodChange, onTimeChange, period, time }: TimePickerCardProps) {
  const reduceMotion = useReducedMotion();
  const pulseProgress = useSharedValue(1);

  useEffect(() => {
    if (!reduceMotion) {
      pulseProgress.value = withSequence(
        withTiming(1.03, { duration: 110, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 150, easing: Easing.out(Easing.cubic) }),
      );
    }
  }, [period, pulseProgress, reduceMotion, time]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseProgress.value }],
  }));

  return (
    <Animated.View style={[styles.timePickerRow, pulseStyle]}>
      <NativeTextInput
        keyboardType="numbers-and-punctuation"
        onChangeText={(value) => onTimeChange(value.replace(/\s*(AM|PM)$/i, ''))}
        style={styles.timePickerInput}
        value={time}
      />
      <Pressable
        accessibilityRole="button"
        onPress={() => onPeriodChange(period === 'AM' ? 'PM' : 'AM')}
        style={styles.periodPill}
      >
        <Text style={styles.periodText}>{period}</Text>
      </Pressable>
    </Animated.View>
  );
}

function SchedulePreview({ checkpoints }: { checkpoints: HydrationCheckpoint[] }) {
  return (
    <View style={styles.scheduleCard}>
      {checkpoints.map((checkpoint, index) => (
        <AnimatedEntrance delay={index * 60} key={checkpoint.id} style={styles.scheduleRowEntrance}>
          <View style={styles.scheduleRow}>
            <Text style={styles.scheduleTime}>{toDisplayTime(checkpoint.dueMinutes)}</Text>
            <Text style={styles.scheduleAmount}>{formatCentiliters(checkpoint.targetMl)}</Text>
          </View>
        </AnimatedEntrance>
      ))}
    </View>
  );
}

type SelectableRowProps = {
  checked: boolean;
  icon?: MaterialIconName;
  iconColor?: string;
  label: string;
  onPress: () => void;
  type?: 'checkbox' | 'radio';
};

function SelectableRow({ checked, icon, iconColor, label, onPress, type = 'checkbox' }: SelectableRowProps) {
  const reduceMotion = useReducedMotion();
  const selectedProgress = useSharedValue(checked ? 1 : 0);
  const pulseProgress = useSharedValue(1);

  useEffect(() => {
    selectedProgress.value = withTiming(checked ? 1 : 0, {
      duration: reduceMotion ? 80 : 220,
      easing: Easing.out(Easing.cubic),
    });

    if (checked && !reduceMotion) {
      pulseProgress.value = withSequence(
        withTiming(0.98, { duration: 90, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 130, easing: Easing.out(Easing.cubic) }),
      );
    }
  }, [checked, pulseProgress, reduceMotion, selectedProgress]);

  const rowStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(selectedProgress.value, [0, 1], [onboardingPanel, onboardingPanelRaised]),
    transform: [{ scale: pulseProgress.value }],
  }));
  const radioStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(selectedProgress.value, [0, 1], [0.7, 1]) }],
  }));

  return (
    <AnimatedTapTarget accessibilityRole="button" onPress={onPress} style={[styles.selectableRow, rowStyle as never]}>
      <View style={styles.rowLabelWrap}>
        {icon ? (
          <Animated.View style={radioStyle}>
            <MaterialCommunityIcons name={icon} color={iconColor ?? waterFirstBlue} size={20} />
          </Animated.View>
        ) : null}
        <Text style={styles.selectableLabel}>{label}</Text>
      </View>
      {type === 'radio' ? (
        <View style={[styles.radioOuter, checked && styles.radioOuterActive]}>
          {checked ? <Animated.View style={[styles.radioInner, radioStyle]} /> : null}
        </View>
      ) : (
        <Checkbox status={checked ? 'checked' : 'unchecked'} color={waterFirstBlue} />
      )}
    </AnimatedTapTarget>
  );
}

function getPrimaryLabel(step: number) {
  if (step === 4) return 'show me how';
  if (step === 11) return 'build my plan';
  if (step === 13) return 'I want this';
  if (step === 17) return 'looks good';
  if (step === 18) return 'continue';
  if (step === 19) return 'set up Hydration Shield';
  if (step === 20) return 'protect these apps';
  if (step === 22) return 'take me to WaterFirst';
  if (step === 23) return 'Create Account';

  return 'continue';
}

function toggleListValue(
  value: string,
  currentValues: string[],
  setValues: Dispatch<SetStateAction<string[]>>,
) {
  setValues((current) =>
    current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
  );
}

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || 'Lebechi';
}

function inferActivityLevel(obstacleIds: string[]): ActivityLevel {
  if (obstacleIds.includes('distracted') || obstacleIds.includes('consistency')) {
    return 'moderate';
  }

  return 'light';
}

function buildActivityDescription(dailyIntake: string, obstacleIds: string[]) {
  const selectedObstacles = obstacleOptions
    .filter((option) => obstacleIds.includes(option.id))
    .map((option) => option.label)
    .join(', ');

  return `Usually drinks ${dailyIntake}. Main hydration blockers: ${selectedObstacles || 'not specified'}.`;
}

function estimateStartingGoalMl(weightValue: number, unit: 'kg' | 'lb') {
  const safeWeight = Number.isFinite(weightValue) && weightValue > 0 ? weightValue : 70;
  const weightKg = unit === 'lb' ? safeWeight * 0.453592 : safeWeight;

  return Math.min(4500, Math.max(1500, Math.round((weightKg * 33) / 100) * 100));
}

function toTwentyFourHourTime(time: string, period: 'AM' | 'PM') {
  const [hourText = '7', minuteText = '0'] = time.split(':');
  let hours = Math.max(1, Math.min(12, Number(hourText) || 7));
  const minutes = Math.max(0, Math.min(59, Number(minuteText) || 0));

  if (period === 'PM' && hours < 12) {
    hours += 12;
  }

  if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function normalizeMinutes(minutes: number) {
  return ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
}

function toDisplayTime(totalMinutes: number) {
  const normalized = normalizeMinutes(totalMinutes);
  const hours24 = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours = hours24 % 12 || 12;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
}

function formatLiters(amountMl: number) {
  return `${(amountMl / 1000).toFixed(1)}L`;
}

function formatCentiliters(amountMl: number) {
  return `${Math.round(amountMl / 10)}cl`;
}

function getDailyGoalDrinkBreakdown(goalMl: number) {
  const drinkCount = DEFAULT_HYDRATION_CHECKPOINT_COUNT;
  const totalCl = Math.max(1, Math.round(goalMl / 10));
  const baseAmountCl = Math.max(1, Math.floor(totalCl / drinkCount));
  const remainderCl = totalCl % drinkCount;

  if (remainderCl === 0) {
    return `that's ${drinkCount} x ${baseAmountCl}cl drinks, totaling ${totalCl}cl throughout your day.`;
  }

  return `that's ${drinkCount} drinks of about ${baseAmountCl}-${baseAmountCl + 1}cl, totaling ${totalCl}cl throughout your day.`;
}

const onboardingBackground = '#03101C';
const onboardingPanel = '#081F31';
const onboardingPanelRaised = '#0B263A';
const waterFirstBlue = '#20C7FF';
const lightBlue = 'rgba(32, 199, 255, 0.1)';
const borderBlue = 'rgba(120, 230, 255, 0.22)';
const mutedText = '#9BB3C4';
const darkText = '#F5FBFF';

const styles = StyleSheet.create({
  keyboard: {
    backgroundColor: onboardingBackground,
    flex: 1,
  },
  scroll: {
    backgroundColor: onboardingBackground,
    flex: 1,
  },
  splashScroll: {
    backgroundColor: onboardingBackground,
  },
  splashScrollContent: {
    backgroundColor: onboardingBackground,
  },
  scrollContent: {
    backgroundColor: onboardingBackground,
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  stepShell: {
    alignSelf: 'center',
    backgroundColor: onboardingBackground,
    flex: 1,
    maxWidth: 430,
    paddingHorizontal: 0,
    position: 'relative',
    width: '100%',
  },
  animatedPage: {
    flex: 1,
  },
  splashShell: {
    backgroundColor: onboardingBackground,
  },
  storyWrap: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.lg,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.lg,
  },
  storyTitle: {
    color: darkText,
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    lineHeight: 28,
    textAlign: 'center',
  },
  storySubtitle: {
    color: darkText,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
    maxWidth: 300,
    textAlign: 'center',
  },
  blueText: {
    color: waterFirstBlue,
    fontFamily: 'Inter_700Bold',
  },
  fullWidth: {
    width: '100%',
  },
  artWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 210,
    width: '100%',
  },
  questionWrap: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.lg,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.lg,
  },
  questionContent: {
    alignItems: 'center',
    gap: spacing.lg,
    width: '100%',
  },
  helperText: {
    color: darkText,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
    maxWidth: 270,
    textAlign: 'center',
  },
  splashContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 604,
    position: 'relative',
  },
  splashDropIcon: {
    position: 'absolute',
    top: 74,
    zIndex: 2,
  },
  splashWritingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 52,
    minWidth: 194,
  },
  splashTitle: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 36,
    letterSpacing: 0,
  },
  splashCursor: {
    backgroundColor: darkText,
    borderRadius: 1,
    height: 34,
    marginLeft: 4,
    width: 3,
  },
  primaryButton: {
    alignSelf: 'center',
    backgroundColor: waterFirstBlue,
    borderRadius: radius.md,
    maxWidth: 382,
    width: '100%',
  },
  primaryButtonContent: {
    minHeight: 52,
  },
  primaryButtonLabel: {
    color: onboardingBackground,
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
  },
  saveMessage: {
    color: waterFirstBlue,
    ...typography.body1,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  bottomActions: {
    backgroundColor: onboardingBackground,
    bottom: 0,
    left: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    position: 'absolute',
    right: 0,
  },
  sideArtRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
  },
  onboardingArtSlot: {
    alignItems: 'center',
    height: 158,
    justifyContent: 'center',
    width: 124,
  },
  phoneArt: {
    alignItems: 'center',
    backgroundColor: '#111D35',
    borderRadius: 16,
    height: 158,
    justifyContent: 'center',
    padding: spacing.md,
    width: 82,
  },
  phoneNotch: {
    backgroundColor: '#040810',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    height: 8,
    position: 'absolute',
    top: 0,
    width: 34,
  },
  batteryOutline: {
    borderColor: '#CEE9FF',
    borderRadius: 5,
    borderWidth: 2,
    height: 64,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: 36,
  },
  batteryFill: {
    backgroundColor: '#65D85F',
    height: '80%',
  },
  phoneText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    marginTop: spacing.sm,
  },
  onboardingKidneyImage: {
    height: 186,
    width: 148,
  },
  kidneyBowl: {
    alignItems: 'center',
    height: 184,
    justifyContent: 'center',
    width: 196,
  },
  kidneyBowlImage: {
    height: '100%',
    width: '100%',
  },
  notificationStack: {
    gap: spacing.md,
    width: '100%',
  },
  notificationCard: {
    alignItems: 'center',
    backgroundColor: onboardingPanel,
    borderColor: borderBlue,
    borderRadius: 10,
    borderWidth: 1,
    elevation: 2,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    shadowColor: waterFirstBlue,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    width: '100%',
  },
  notificationTitle: {
    color: darkText,
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
  },
  notificationBody: {
    color: mutedText,
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
  },
  swipedText: {
    color: '#FF8C8C',
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    textAlign: 'center',
  },
  flowRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    width: '100%',
  },
  flowItem: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
  },
  flowIcon: {
    alignItems: 'center',
    backgroundColor: onboardingPanel,
    borderColor: borderBlue,
    borderRadius: 10,
    borderWidth: 1,
    height: 74,
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  flowLock: {
    position: 'absolute',
    right: 8,
    top: 8,
  },
  flowAmount: {
    bottom: 6,
    color: waterFirstBlue,
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    position: 'absolute',
  },
  flowLabel: {
    color: darkText,
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    lineHeight: 12,
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: onboardingPanel,
    borderColor: borderBlue,
    borderRadius: 8,
    borderWidth: 1,
    color: darkText,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    maxWidth: 300,
    minHeight: 56,
    paddingHorizontal: spacing.md,
    width: '100%',
  },
  weightCard: {
    alignItems: 'center',
    backgroundColor: onboardingPanel,
    borderColor: borderBlue,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 3,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    maxWidth: 250,
    padding: spacing.md,
    shadowColor: waterFirstBlue,
    shadowOpacity: 0.16,
    shadowRadius: 12,
    width: '100%',
  },
  weightInput: {
    color: waterFirstBlue,
    fontFamily: 'Inter_700Bold',
    fontSize: 35,
    minWidth: 105,
    textAlign: 'right',
  },
  weightUnit: {
    color: darkText,
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
  },
  segmentRow: {
    backgroundColor: onboardingPanel,
    borderRadius: 9,
    flexDirection: 'row',
    padding: 3,
  },
  segmentButton: {
    borderRadius: 7,
    minWidth: 58,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  segmentButtonActive: {
    backgroundColor: waterFirstBlue,
  },
  segmentText: {
    color: mutedText,
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    textAlign: 'center',
  },
  segmentTextActive: {
    color: onboardingBackground,
  },
  listCard: {
    backgroundColor: onboardingPanel,
    borderColor: borderBlue,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: 330,
    overflow: 'hidden',
    width: '100%',
  },
  selectableRow: {
    alignItems: 'center',
    borderBottomColor: borderBlue,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  rowLabelWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: spacing.sm,
  },
  selectableLabel: {
    color: darkText,
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  radioOuter: {
    alignItems: 'center',
    borderColor: '#A9B8C8',
    borderRadius: 8,
    borderWidth: 2,
    height: 16,
    justifyContent: 'center',
    width: 16,
  },
  radioOuterActive: {
    borderColor: waterFirstBlue,
  },
  radioInner: {
    backgroundColor: waterFirstBlue,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  sadKidneyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  sadKidneyImage: {
    height: 176,
    width: 260,
  },
  sadFace: {
    alignItems: 'center',
    gap: 4,
  },
  sadEye: {
    backgroundColor: '#0A6BDE',
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  sadMouth: {
    borderColor: '#0A6BDE',
    borderTopWidth: 2,
    borderRadius: 16,
    height: 14,
    transform: [{ rotate: '180deg' }],
    width: 28,
  },
  goalBig: {
    color: waterFirstBlue,
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 64,
    lineHeight: 72,
  },
  cupRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'center',
    maxWidth: 280,
  },
  happyDropImage: {
    height: 220,
    width: 220,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    justifyContent: 'center',
    maxWidth: 246,
  },
  calendarDay: {
    alignItems: 'center',
    backgroundColor: onboardingPanel,
    borderColor: borderBlue,
    borderRadius: 12,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  calendarDayActive: {
    backgroundColor: waterFirstBlue,
    borderColor: waterFirstBlue,
  },
  calendarText: {
    color: darkText,
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
  },
  calendarTextActive: {
    color: onboardingBackground,
  },
  streakText: {
    color: waterFirstBlue,
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
  },
  featureList: {
    gap: spacing.sm,
    maxWidth: 330,
    width: '100%',
  },
  featureRow: {
    alignItems: 'center',
    backgroundColor: onboardingPanel,
    borderColor: borderBlue,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 66,
    padding: spacing.md,
  },
  featureTitle: {
    color: darkText,
    flex: 1,
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
  },
  featureBody: {
    color: mutedText,
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 15,
  },
  timePickerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  timePickerInput: {
    backgroundColor: onboardingPanel,
    borderColor: borderBlue,
    borderRadius: 12,
    borderWidth: 1,
    color: waterFirstBlue,
    fontFamily: 'Inter_700Bold',
    fontSize: 36,
    minHeight: 78,
    minWidth: 154,
    paddingHorizontal: spacing.md,
    textAlign: 'center',
  },
  periodPill: {
    alignItems: 'center',
    backgroundColor: lightBlue,
    borderColor: borderBlue,
    borderRadius: 12,
    borderWidth: 1,
    height: 68,
    justifyContent: 'center',
    width: 70,
  },
  periodText: {
    color: waterFirstBlue,
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
  },
  scheduleCard: {
    backgroundColor: onboardingPanel,
    borderColor: borderBlue,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: 285,
    overflow: 'hidden',
    width: '100%',
  },
  scheduleRowEntrance: {
    width: '100%',
  },
  scheduleRow: {
    borderBottomColor: borderBlue,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  scheduleTime: {
    color: darkText,
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
  },
  scheduleAmount: {
    color: darkText,
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
  },
  blueFinePrint: {
    color: waterFirstBlue,
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    textAlign: 'center',
  },
  reminderPermissionWrap: {
    alignItems: 'center',
    gap: spacing.lg,
    width: '100%',
  },
  notificationToggleCard: {
    alignItems: 'center',
    backgroundColor: onboardingPanel,
    borderColor: borderBlue,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    maxWidth: 330,
    minHeight: 76,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    width: '100%',
  },
  notificationToggleIcon: {
    alignItems: 'center',
    backgroundColor: lightBlue,
    borderColor: borderBlue,
    borderRadius: 16,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  notificationToggleText: {
    flex: 1,
    gap: 2,
  },
  notificationToggleTitle: {
    color: darkText,
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
  },
  notificationToggleBody: {
    color: mutedText,
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 14,
  },
  reminderArt: {
    alignItems: 'center',
    gap: spacing.lg,
    width: '100%',
  },
  lockScreen: {
    alignItems: 'center',
    backgroundColor: onboardingPanelRaised,
    borderRadius: 14,
    height: 108,
    justifyContent: 'center',
    width: 190,
  },
  lockTime: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
  },
  lockSub: {
    color: '#CDE9FF',
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
  },
  distractionArt: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  distractionIcon: {
    alignItems: 'center',
    backgroundColor: '#101827',
    borderRadius: 16,
    height: 72,
    justifyContent: 'center',
    position: 'relative',
    width: 72,
  },
  smallLock: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    bottom: -6,
    height: 22,
    justifyContent: 'center',
    position: 'absolute',
    right: -4,
    width: 22,
  },
  quickLogRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
    position: 'relative',
  },
  quickPill: {
    backgroundColor: onboardingPanel,
    borderColor: borderBlue,
    borderWidth: 1,
    borderRadius: 9,
    minWidth: 68,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  quickPillActive: {
    backgroundColor: waterFirstBlue,
  },
  quickText: {
    color: darkText,
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    textAlign: 'center',
  },
  quickTextActive: {
    color: onboardingBackground,
  },
  burstWrap: {
    alignItems: 'center',
    height: 1,
    justifyContent: 'center',
    marginTop: -spacing.md,
    position: 'relative',
    width: 1,
  },
  burstDrop: {
    position: 'absolute',
  },
  celebrationWrap: {
    alignItems: 'center',
  },
  celebrationDropImage: {
    height: 230,
    width: 300,
  },
  confetti: {
    color: waterFirstBlue,
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    letterSpacing: 18,
  },
});
