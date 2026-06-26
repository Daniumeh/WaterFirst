create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  first_name text not null default '',
  last_name text not null default '',
  display_name text not null default '',
  weight numeric(6, 2) not null default 180 check (weight > 0),
  activity_level text not null default 'moderate' check (activity_level in ('light', 'moderate', 'high')),
  activity_description text not null default '',
  climate text not null default 'temperate' check (climate in ('cool', 'temperate', 'hot')),
  wake_time time not null default '07:00',
  sleep_time time not null default '22:30',
  unit_preference text not null default 'imperial' check (unit_preference in ('imperial', 'metric')),
  notification_consent boolean not null default false,
  soft_lock_consent boolean not null default false,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hydration_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  active_on date not null default current_date,
  target_ml integer not null check (target_ml > 0),
  manual_override_ml integer check (manual_override_ml is null or manual_override_ml > 0),
  unit_preference text not null default 'imperial' check (unit_preference in ('imperial', 'metric')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, active_on)
);

create table if not exists public.hydration_checkpoints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.hydration_goals(id) on delete cascade,
  due_on date not null default current_date,
  time_label text not null,
  due_minutes integer not null check (due_minutes between 0 and 1439),
  target_ml integer not null check (target_ml > 0),
  status text not null default 'upcoming' check (status in ('completed', 'missed', 'upcoming', 'snoozed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (goal_id, due_minutes)
);

create table if not exists public.water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_ml integer not null check (amount_ml > 0),
  unit text not null default 'ml' check (unit in ('cl', 'ml', 'l', 'oz')),
  source text not null default 'quick_log' check (
    source in ('quick_log', 'custom', 'sachet_water', 'small_bottle', 'medium_bottle', 'large_bottle', 'import')
  ),
  logged_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.reminder_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default true,
  active_start time not null default '07:00',
  active_end time not null default '22:30',
  snooze_minutes integer not null default 30 check (snooze_minutes between 1 and 240),
  paused_until timestamptz,
  notification_permission_status text not null default 'unknown' check (
    notification_permission_status in ('unknown', 'granted', 'denied', 'provisional')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.soft_lock_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  consent_given boolean not null default false,
  next_enforcement_at timestamptz,
  compliance_score integer not null default 100 check (compliance_score between 0 and 100),
  snoozed_until timestamptz,
  override_count integer not null default 0 check (override_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.soft_lock_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  checkpoint_id uuid references public.hydration_checkpoints(id) on delete set null,
  event_type text not null check (
    event_type in ('triggered', 'snoozed', 'override', 'logged_water', 'dismissed')
  ),
  action_amount_ml integer check (action_amount_ml is null or action_amount_ml > 0),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table if not exists public.daily_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  summary_date date not null,
  target_ml integer not null default 0 check (target_ml >= 0),
  consumed_ml integer not null default 0 check (consumed_ml >= 0),
  drink_count integer not null default 0 check (drink_count >= 0),
  completed_goal boolean not null default false,
  compliance_score integer not null default 100 check (compliance_score between 0 and 100),
  streak_day_count integer not null default 0 check (streak_day_count >= 0),
  insights text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, summary_date)
);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  target_days integer not null default 7 check (target_days > 0),
  target_ml_per_day integer check (target_ml_per_day is null or target_ml_per_day > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_challenges (
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  joined_at timestamptz not null default now(),
  completed_at timestamptz,
  progress_days integer not null default 0 check (progress_days >= 0),
  current_streak integer not null default 0 check (current_streak >= 0),
  primary key (user_id, challenge_id)
);

create index if not exists hydration_goals_user_active_on_idx on public.hydration_goals(user_id, active_on desc);
create index if not exists hydration_checkpoints_user_due_idx on public.hydration_checkpoints(user_id, due_on, due_minutes);
create index if not exists water_logs_user_logged_at_idx on public.water_logs(user_id, logged_at desc);
create index if not exists soft_lock_events_user_occurred_at_idx on public.soft_lock_events(user_id, occurred_at desc);
create index if not exists daily_summaries_user_date_idx on public.daily_summaries(user_id, summary_date desc);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger hydration_goals_set_updated_at
before update on public.hydration_goals
for each row execute function public.set_updated_at();

create trigger hydration_checkpoints_set_updated_at
before update on public.hydration_checkpoints
for each row execute function public.set_updated_at();

create trigger reminder_settings_set_updated_at
before update on public.reminder_settings
for each row execute function public.set_updated_at();

create trigger soft_lock_settings_set_updated_at
before update on public.soft_lock_settings
for each row execute function public.set_updated_at();

create trigger daily_summaries_set_updated_at
before update on public.daily_summaries
for each row execute function public.set_updated_at();

create trigger challenges_set_updated_at
before update on public.challenges
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    first_name,
    last_name,
    display_name,
    weight,
    activity_level,
    activity_description,
    climate,
    wake_time,
    sleep_time,
    unit_preference,
    notification_consent,
    soft_lock_consent,
    onboarding_complete
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    trim(coalesce(new.raw_user_meta_data->>'first_name', '') || ' ' || coalesce(new.raw_user_meta_data->>'last_name', '')),
    coalesce(nullif(new.raw_user_meta_data->>'weight', '')::numeric, 180),
    coalesce(new.raw_user_meta_data->>'activity_level', 'moderate'),
    coalesce(new.raw_user_meta_data->>'activity_description', ''),
    coalesce(new.raw_user_meta_data->>'climate', 'temperate'),
    coalesce(nullif(new.raw_user_meta_data->>'wake_time', '')::time, '07:00'::time),
    coalesce(nullif(new.raw_user_meta_data->>'sleep_time', '')::time, '22:30'::time),
    coalesce(new.raw_user_meta_data->>'unit_preference', 'imperial'),
    coalesce(nullif(new.raw_user_meta_data->>'notification_consent', '')::boolean, false),
    coalesce(nullif(new.raw_user_meta_data->>'soft_lock_consent', '')::boolean, false),
    coalesce(nullif(new.raw_user_meta_data->>'onboarding_complete', '')::boolean, false)
  )
  on conflict (id) do update set
    email = excluded.email,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    display_name = excluded.display_name,
    weight = excluded.weight,
    activity_level = excluded.activity_level,
    activity_description = excluded.activity_description,
    climate = excluded.climate,
    wake_time = excluded.wake_time,
    sleep_time = excluded.sleep_time,
    unit_preference = excluded.unit_preference,
    notification_consent = excluded.notification_consent,
    soft_lock_consent = excluded.soft_lock_consent,
    onboarding_complete = excluded.onboarding_complete;

  insert into public.reminder_settings (user_id, enabled, active_start, active_end)
  values (new.id, true, '07:00', '22:30')
  on conflict (user_id) do nothing;

  insert into public.soft_lock_settings (user_id, enabled, consent_given)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'soft_lock_consent', '')::boolean, false),
    coalesce(nullif(new.raw_user_meta_data->>'soft_lock_consent', '')::boolean, false)
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.hydration_goals enable row level security;
alter table public.hydration_checkpoints enable row level security;
alter table public.water_logs enable row level security;
alter table public.reminder_settings enable row level security;
alter table public.soft_lock_settings enable row level security;
alter table public.soft_lock_events enable row level security;
alter table public.daily_summaries enable row level security;
alter table public.challenges enable row level security;
alter table public.user_challenges enable row level security;

create policy "profiles_select_own" on public.profiles
for select to authenticated using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles
for delete to authenticated using (auth.uid() = id);

create policy "hydration_goals_select_own" on public.hydration_goals
for select to authenticated using (auth.uid() = user_id);
create policy "hydration_goals_insert_own" on public.hydration_goals
for insert to authenticated with check (auth.uid() = user_id);
create policy "hydration_goals_update_own" on public.hydration_goals
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "hydration_goals_delete_own" on public.hydration_goals
for delete to authenticated using (auth.uid() = user_id);

create policy "hydration_checkpoints_select_own" on public.hydration_checkpoints
for select to authenticated using (auth.uid() = user_id);
create policy "hydration_checkpoints_insert_own" on public.hydration_checkpoints
for insert to authenticated with check (auth.uid() = user_id);
create policy "hydration_checkpoints_update_own" on public.hydration_checkpoints
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "hydration_checkpoints_delete_own" on public.hydration_checkpoints
for delete to authenticated using (auth.uid() = user_id);

create policy "water_logs_select_own" on public.water_logs
for select to authenticated using (auth.uid() = user_id);
create policy "water_logs_insert_own" on public.water_logs
for insert to authenticated with check (auth.uid() = user_id);
create policy "water_logs_update_own" on public.water_logs
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "water_logs_delete_own" on public.water_logs
for delete to authenticated using (auth.uid() = user_id);

create policy "reminder_settings_select_own" on public.reminder_settings
for select to authenticated using (auth.uid() = user_id);
create policy "reminder_settings_insert_own" on public.reminder_settings
for insert to authenticated with check (auth.uid() = user_id);
create policy "reminder_settings_update_own" on public.reminder_settings
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reminder_settings_delete_own" on public.reminder_settings
for delete to authenticated using (auth.uid() = user_id);

create policy "soft_lock_settings_select_own" on public.soft_lock_settings
for select to authenticated using (auth.uid() = user_id);
create policy "soft_lock_settings_insert_own" on public.soft_lock_settings
for insert to authenticated with check (auth.uid() = user_id);
create policy "soft_lock_settings_update_own" on public.soft_lock_settings
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "soft_lock_settings_delete_own" on public.soft_lock_settings
for delete to authenticated using (auth.uid() = user_id);

create policy "soft_lock_events_select_own" on public.soft_lock_events
for select to authenticated using (auth.uid() = user_id);
create policy "soft_lock_events_insert_own" on public.soft_lock_events
for insert to authenticated with check (auth.uid() = user_id);
create policy "soft_lock_events_update_own" on public.soft_lock_events
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "soft_lock_events_delete_own" on public.soft_lock_events
for delete to authenticated using (auth.uid() = user_id);

create policy "daily_summaries_select_own" on public.daily_summaries
for select to authenticated using (auth.uid() = user_id);
create policy "daily_summaries_insert_own" on public.daily_summaries
for insert to authenticated with check (auth.uid() = user_id);
create policy "daily_summaries_update_own" on public.daily_summaries
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "daily_summaries_delete_own" on public.daily_summaries
for delete to authenticated using (auth.uid() = user_id);

create policy "challenges_select_active" on public.challenges
for select to authenticated using (is_active = true);

create policy "user_challenges_select_own" on public.user_challenges
for select to authenticated using (auth.uid() = user_id);
create policy "user_challenges_insert_own" on public.user_challenges
for insert to authenticated with check (auth.uid() = user_id);
create policy "user_challenges_update_own" on public.user_challenges
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_challenges_delete_own" on public.user_challenges
for delete to authenticated using (auth.uid() = user_id);

insert into public.challenges (slug, title, description, target_days, target_ml_per_day)
values
  ('seven-day-streak', '7 Day Hydration Streak', 'Complete your hydration goal for seven days in a row.', 7, null),
  ('morning-anchor', 'Morning Anchor', 'Log your first drink before your first checkpoint for five days.', 5, null),
  ('soft-lock-reset', 'Soft Lock Reset', 'Recover from missed checkpoints without overriding for three days.', 3, null)
on conflict (slug) do nothing;
