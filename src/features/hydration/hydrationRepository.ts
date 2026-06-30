import type {
  HydrationCheckpoint,
  HydrationGoal,
  HydrationProfile,
} from '@/src/features/hydration/types';
import { supabase } from '@/src/lib/supabase';

import { getAccurateLogTimestamp, getDeviceNow, getLocalDateKey } from './deviceTime';

type SaveOnboardingPlanInput = {
  checkpoints: HydrationCheckpoint[];
  goal: HydrationGoal;
  profile: HydrationProfile;
};

export async function saveOnboardingPlan({
  checkpoints,
  goal,
  profile,
}: SaveOnboardingPlanInput) {
  if (!supabase) {
    return;
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return;
  }

  const today = getLocalDateKey();

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: user.id,
    activity_description: profile.activityDescription,
    activity_level: profile.activityLevel,
    climate: profile.climate,
    display_name: profile.name,
    email: profile.email,
    first_name: profile.firstName,
    last_name: profile.lastName,
    notification_consent: profile.notificationConsent,
    onboarding_complete: profile.onboardingComplete,
    sleep_time: profile.sleepTime,
    soft_lock_consent: profile.softLockConsent,
    unit_preference: profile.unitPreference,
    wake_time: profile.wakeTime,
    weight: profile.weight,
  });

  if (profileError) {
    throw profileError;
  }

  const { data: savedGoal, error: goalError } = await supabase
    .from('hydration_goals')
    .upsert(
      {
        active_on: today,
        is_active: true,
        manual_override_ml: goal.manualOverrideMl,
        target_ml: goal.targetMl,
        unit_preference: goal.unitPreference,
        user_id: user.id,
      },
      { onConflict: 'user_id,active_on' },
    )
    .select('id')
    .single();

  if (goalError) {
    throw goalError;
  }

  const goalId = savedGoal.id as string;

  const { error: deleteCheckpointsError } = await supabase
    .from('hydration_checkpoints')
    .delete()
    .eq('goal_id', goalId);

  if (deleteCheckpointsError) {
    throw deleteCheckpointsError;
  }

  if (checkpoints.length > 0) {
    const { error: checkpointError } = await supabase.from('hydration_checkpoints').insert(
      checkpoints.map((checkpoint) => ({
        due_minutes: checkpoint.dueMinutes,
        due_on: today,
        goal_id: goalId,
        status: 'upcoming',
        target_ml: checkpoint.targetMl,
        time_label: checkpoint.timeLabel,
        user_id: user.id,
      })),
    );

    if (checkpointError) {
      throw checkpointError;
    }
  }

  const { error: reminderError } = await supabase.from('reminder_settings').upsert({
    active_end: profile.sleepTime,
    active_start: profile.wakeTime,
    enabled: profile.notificationConsent,
    notification_permission_status: profile.notificationConsent ? 'granted' : 'unknown',
    snooze_minutes: 30,
    user_id: user.id,
  });

  if (reminderError) {
    throw reminderError;
  }

  const { error: softLockError } = await supabase.from('soft_lock_settings').upsert({
    consent_given: profile.softLockConsent,
    enabled: profile.softLockConsent,
    user_id: user.id,
  });

  if (softLockError) {
    throw softLockError;
  }
}

export async function saveWaterLog(amountMl: number, source = 'quick_log', loggedAt = getDeviceNow()) {
  if (!supabase) {
    return;
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return;
  }

  await supabase.from('water_logs').insert({
    amount_ml: amountMl,
    logged_at: getAccurateLogTimestamp(loggedAt),
    source,
    unit: 'ml',
    user_id: user.id,
  });
}
