-- Final profile, avatar, and maintenance stabilization.
-- Forward-only: apply after 202607170002_profile_onboarding_polish.sql.

alter table public.profiles
  add column if not exists biggest_learning_struggle text;

alter table public.profiles drop constraint if exists profiles_biggest_learning_struggle_length;
alter table public.profiles add constraint profiles_biggest_learning_struggle_length
  check (biggest_learning_struggle is null or char_length(biggest_learning_struggle) <= 500) not valid;

grant update (biggest_learning_struggle) on public.profiles to authenticated;

-- A profile edit is one transaction. This prevents a successful profile update
-- followed by a failed preference update from leaving different screens out of sync.
create or replace function public.save_learner_profile(
  profile_display_name text,
  profile_username text,
  profile_bio text,
  profile_experience text,
  primary_goal text,
  interests jsonb,
  starting_language text,
  minutes_per_day integer,
  preferred_format text,
  learning_struggle text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if not public.is_safe_display_name(profile_display_name) then raise exception 'Invalid display name' using errcode = '22023'; end if;
  if profile_experience not in ('Completely new','I''ve tried a little','Beginner','Intermediate','Advanced') then raise exception 'Invalid experience level' using errcode = '22023'; end if;
  if primary_goal not in ('Build websites','Learn programming basics','Make games','Build mobile apps','Learn Python','Learn JavaScript','Prepare for school','Coding careers','Something else') then raise exception 'Invalid learning goal' using errcode = '22023'; end if;
  if starting_language not in ('html','css','javascript','python','cpp','swift','lua','help_me_choose') then raise exception 'Invalid starting language' using errcode = '22023'; end if;
  if minutes_per_day not in (10,20,30,45,60) or preferred_format not in ('guided_lessons','projects','quizzes','mixed') then raise exception 'Invalid learning preference' using errcode = '22023'; end if;

  update public.profiles set
    display_name = profile_display_name,
    username = nullif(profile_username, ''),
    bio = nullif(btrim(profile_bio), ''),
    experience_level = profile_experience,
    learning_goal = primary_goal,
    preferred_language = starting_language,
    biggest_learning_struggle = nullif(btrim(learning_struggle), ''),
    updated_at = now()
  where id = current_user_id;
  if not found then raise exception 'Profile not found' using errcode = 'P0002'; end if;

  insert into public.learning_preferences (user_id, daily_minutes, learning_format)
  values (current_user_id, minutes_per_day, preferred_format)
  on conflict (user_id) do update set
    daily_minutes = excluded.daily_minutes,
    learning_format = excluded.learning_format,
    updated_at = now();

  delete from public.learning_goals where user_id = current_user_id;
  insert into public.learning_goals (user_id, goal)
  select current_user_id, value
  from (
    select primary_goal as value
    union
    select jsonb_array_elements_text(coalesce(interests, '[]'::jsonb))
  ) goals
  where char_length(value) between 2 and 80
    and value in ('Build websites','Learn programming basics','Make games','Build mobile apps','Learn Python','Learn JavaScript','Prepare for school','Coding careers','Something else');
end;
$$;

revoke all on function public.save_learner_profile(text,text,text,text,text,jsonb,text,integer,text,text) from public;
grant execute on function public.save_learner_profile(text,text,text,text,text,jsonb,text,integer,text,text) to authenticated;

-- Keep the public bucket narrowly limited to supported raster formats. Object
-- ownership is enforced by the first path segment matching auth.uid().
update storage.buckets
set public = true,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg','image/png','image/webp']
where id = 'avatars';

-- Scheduling fields are inert until explicitly enabled and tied to a unique
-- event token so an old schedule cannot reactivate a newer configuration.
alter table public.site_settings
  add column if not exists preset_key text,
  add column if not exists scheduled_start_at timestamptz,
  add column if not exists scheduled_end_at timestamptz,
  add column if not exists schedule_event_id uuid,
  add column if not exists automatic_progress boolean not null default false,
  add column if not exists automatic_messages boolean not null default false,
  add column if not exists automatic_updates boolean not null default false;

create table if not exists public.maintenance_history (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null,
  action text not null check (action in ('configured','enabled','disabled','automatic_start','automatic_end','automatic_update')),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_kind text not null default 'staff' check (actor_kind in ('staff','automation')),
  preset_key text,
  title text not null,
  message text not null,
  scheduled_start_at timestamptz,
  scheduled_end_at timestamptz,
  maintenance_enabled boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists maintenance_history_created_idx on public.maintenance_history (created_at desc);
create index if not exists maintenance_history_event_idx on public.maintenance_history (event_id, created_at desc);
alter table public.maintenance_history enable row level security;
drop policy if exists "Admins read maintenance history" on public.maintenance_history;
create policy "Admins read maintenance history" on public.maintenance_history
  for select to authenticated using (public.is_site_admin());

create table if not exists public.maintenance_automation_milestones (
  event_id uuid not null,
  milestone integer not null check (milestone in (25, 50, 75, 90)),
  created_at timestamptz not null default now(),
  primary key (event_id, milestone)
);
alter table public.maintenance_automation_milestones enable row level security;

-- Called only by the server-side cron route with the service-role client.
create or replace function public.process_due_maintenance_automation()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  settings public.site_settings%rowtype;
  progress integer;
  milestone integer;
  result jsonb := '{"started":false,"ended":false,"progress":false,"update":false}'::jsonb;
begin
  if coalesce(auth.jwt()->>'role', '') <> 'service_role' then
    raise exception 'Service role required' using errcode = '42501';
  end if;
  select * into settings from public.site_settings where id = 'global' for update;

  if settings.schedule_event_id is not null and not settings.maintenance_enabled
     and settings.scheduled_start_at is not null and settings.scheduled_start_at <= now()
     and (settings.scheduled_end_at is null or settings.scheduled_end_at > now()) then
    update public.site_settings set maintenance_enabled = true where id = 'global';
    insert into public.maintenance_history(event_id, action, actor_kind, preset_key, title, message, scheduled_start_at, scheduled_end_at, maintenance_enabled)
    values(settings.schedule_event_id, 'automatic_start', 'automation', settings.preset_key, settings.maintenance_title, settings.maintenance_message, settings.scheduled_start_at, settings.scheduled_end_at, true);
    result := jsonb_set(result, '{started}', 'true');
    settings.maintenance_enabled := true;
  end if;

  if settings.schedule_event_id is not null and settings.maintenance_enabled
     and settings.scheduled_end_at is not null and settings.scheduled_end_at <= now() then
    update public.site_settings set maintenance_enabled = false, progress_percent = 100,
      scheduled_start_at = null, scheduled_end_at = null, schedule_event_id = null where id = 'global';
    insert into public.maintenance_history(event_id, action, actor_kind, preset_key, title, message, scheduled_start_at, scheduled_end_at, maintenance_enabled)
    values(settings.schedule_event_id, 'automatic_end', 'automation', settings.preset_key, settings.maintenance_title, settings.maintenance_message, settings.scheduled_start_at, settings.scheduled_end_at, false);
    return jsonb_set(result, '{ended}', 'true');
  end if;

  if settings.maintenance_enabled and settings.automatic_progress
     and settings.scheduled_start_at is not null and settings.scheduled_end_at is not null
     and settings.scheduled_end_at > settings.scheduled_start_at then
    progress := least(90, greatest(0, floor(100 * extract(epoch from (now() - settings.scheduled_start_at)) /
      extract(epoch from (settings.scheduled_end_at - settings.scheduled_start_at)))::integer));
    update public.site_settings set progress_percent = progress where id = 'global';
    result := jsonb_set(result, '{progress}', 'true');
    if settings.automatic_updates then
      milestone := case when progress >= 90 then 90 when progress >= 75 then 75 when progress >= 50 then 50 when progress >= 25 then 25 else null end;
      if milestone is not null then
        insert into public.maintenance_automation_milestones(event_id, milestone) values(settings.schedule_event_id, milestone)
        on conflict do nothing;
        if found then
          insert into public.maintenance_updates(title, message, published_at, visible)
          values('Maintenance progress', case milestone when 25 then 'Maintenance is underway.' when 50 then 'Core updates are being completed.' when 75 then 'Final checks are being completed.' else 'Services are preparing to return online.' end, now(), true);
          insert into public.maintenance_history(event_id, action, actor_kind, preset_key, title, message, scheduled_start_at, scheduled_end_at, maintenance_enabled)
          values(settings.schedule_event_id, 'automatic_update', 'automation', settings.preset_key, settings.maintenance_title, settings.maintenance_message, settings.scheduled_start_at, settings.scheduled_end_at, true);
          result := jsonb_set(result, '{update}', 'true');
        end if;
      end if;
    end if;
  end if;
  return result;
end;
$$;

revoke all on function public.process_due_maintenance_automation() from public;
grant execute on function public.process_due_maintenance_automation() to service_role;

create or replace function public.get_public_maintenance_state()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'settings', jsonb_build_object(
      'maintenance_enabled', s.maintenance_enabled,
      'maintenance_title', s.maintenance_title,
      'maintenance_message', s.maintenance_message,
      'maintenance_status', s.maintenance_status,
      'maintenance_badge_text', s.maintenance_badge_text,
      'estimated_return_at', s.estimated_return_at,
      'show_countdown', s.show_countdown,
      'show_progress', s.show_progress,
      'progress_percent', s.progress_percent,
      'allow_admin_bypass', s.allow_admin_bypass,
      'allow_authenticated_users', s.allow_authenticated_users,
      'allow_login_during_maintenance', s.allow_login_during_maintenance,
      'show_personalized_message', s.show_personalized_message,
      'show_saved_progress_message', s.show_saved_progress_message,
      'auto_refresh_enabled', s.auto_refresh_enabled,
      'auto_refresh_interval_seconds', s.auto_refresh_interval_seconds,
      'support_message', s.support_message,
      'contact_email', s.contact_email,
      'automatic_progress', s.automatic_progress,
      'automatic_messages', s.automatic_messages,
      'automatic_updates', s.automatic_updates,
      'scheduled_start_at', s.scheduled_start_at,
      'scheduled_end_at', s.scheduled_end_at,
      'preset_key', s.preset_key,
      'updated_at', s.updated_at
    ),
    'tasks', coalesce((
      select jsonb_agg(to_jsonb(t) - 'created_at' - 'updated_at' order by t.display_order)
      from public.maintenance_tasks t where t.visible
    ), '[]'::jsonb),
    'updates', coalesce((
      select jsonb_agg(to_jsonb(u) order by u.published_at desc)
      from public.maintenance_updates u where u.visible
    ), '[]'::jsonb)
  ) from public.site_settings s where s.id = 'global';
$$;

grant execute on function public.get_public_maintenance_state() to anon, authenticated;

-- Wrap the existing proven configuration writer so content, automation fields,
-- and history either all save or all roll back together.
create or replace function public.save_maintenance_configuration_v2(
  settings_payload jsonb,
  tasks_payload jsonb,
  updates_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  event_id uuid := coalesce(nullif(settings_payload->>'schedule_event_id', '')::uuid, gen_random_uuid());
  was_enabled boolean;
  next_enabled boolean := (settings_payload->>'maintenance_enabled')::boolean;
begin
  if not public.is_site_admin() then raise exception 'Administrator access is required' using errcode = '42501'; end if;
  select maintenance_enabled into was_enabled from public.site_settings where id = 'global' for update;
  perform public.save_maintenance_configuration(settings_payload, tasks_payload, updates_payload);
  update public.site_settings set
    preset_key = nullif(settings_payload->>'preset_key', ''),
    scheduled_start_at = case when was_enabled and not next_enabled then null else nullif(settings_payload->>'scheduled_start_at', '')::timestamptz end,
    scheduled_end_at = case when was_enabled and not next_enabled then null else nullif(settings_payload->>'scheduled_end_at', '')::timestamptz end,
    schedule_event_id = case
      when was_enabled and not next_enabled then null
      when nullif(settings_payload->>'scheduled_start_at', '') is not null
        or nullif(settings_payload->>'scheduled_end_at', '') is not null
        or next_enabled then event_id
      else null
    end,
    automatic_progress = coalesce((settings_payload->>'automatic_progress')::boolean, false),
    automatic_messages = coalesce((settings_payload->>'automatic_messages')::boolean, false),
    automatic_updates = coalesce((settings_payload->>'automatic_updates')::boolean, false)
  where id = 'global';

  insert into public.maintenance_history(event_id, action, actor_id, actor_kind, preset_key, title, message, scheduled_start_at, scheduled_end_at, maintenance_enabled)
  values(event_id,
    case when not was_enabled and next_enabled then 'enabled' when was_enabled and not next_enabled then 'disabled' else 'configured' end,
    auth.uid(), 'staff', nullif(settings_payload->>'preset_key', ''), settings_payload->>'maintenance_title', settings_payload->>'maintenance_message',
    nullif(settings_payload->>'scheduled_start_at', '')::timestamptz, nullif(settings_payload->>'scheduled_end_at', '')::timestamptz, next_enabled);
end;
$$;

revoke all on function public.save_maintenance_configuration_v2(jsonb,jsonb,jsonb) from public;
grant execute on function public.save_maintenance_configuration_v2(jsonb,jsonb,jsonb) to authenticated;
