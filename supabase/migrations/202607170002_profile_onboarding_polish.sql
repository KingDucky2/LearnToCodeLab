-- Safe identity, onboarding, and avatar-storage improvements.
-- Existing users are not forced through onboarding; new accounts are.

alter table public.profiles
  add column if not exists onboarding_required boolean not null default false,
  add column if not exists avatar_source text not null default 'provider';

alter table public.profiles
  drop constraint if exists profiles_avatar_source_check,
  add constraint profiles_avatar_source_check check (avatar_source in ('provider','custom'));

grant update (avatar_source) on public.profiles to authenticated;

alter table public.learning_preferences
  add column if not exists daily_minutes integer not null default 20,
  add column if not exists learning_format text not null default 'mixed';

alter table public.learning_preferences
  drop constraint if exists learning_preferences_daily_minutes_check,
  add constraint learning_preferences_daily_minutes_check check (daily_minutes in (10, 20, 30, 45, 60)),
  drop constraint if exists learning_preferences_learning_format_check,
  add constraint learning_preferences_learning_format_check check (learning_format in ('guided_lessons', 'projects', 'quizzes', 'mixed'));

create or replace function public.is_safe_display_name(candidate text)
returns boolean
language sql
immutable
set search_path = public
as $$
  select candidate is null or (
    char_length(btrim(candidate)) between 2 and 40
    and btrim(candidate) !~* '(https?://|www\.|[[:alnum:]._%+-]+@[[:alnum:].-]+\.[[:alpha:]]{2,})'
    and btrim(candidate) ~ '^[[:alpha:]][[:alpha:][:space:]''’.,-]*[[:alpha:].]$'
    and btrim(candidate) !~ '[''’.,-]{3,}'
    and regexp_replace(lower(btrim(candidate)), '[^a-z]+', '', 'g') !~ '(owner|administrator|admin|staff|moderator|learntocodelabstaff|officialsupport)'
  );
$$;

alter table public.profiles drop constraint if exists profiles_username_format_check;
alter table public.profiles drop constraint if exists profiles_display_name_safe_check;
alter table public.profiles drop constraint if exists profiles_username_key;
drop index if exists public.profiles_username_unique_idx;

alter table public.profiles
  add constraint profiles_username_format_check check (
    username is null or (
      char_length(username) between 3 and 20
      and username ~ '^[A-Za-z0-9_]+$'
      and username !~ '(^_|_$|__)'
      and lower(username) not in ('admin','owner','staff','support','moderator','learntocodelab','system','null','undefined')
    )
  ) not valid,
  add constraint profiles_display_name_safe_check check (public.is_safe_display_name(display_name)) not valid;

create unique index if not exists profiles_username_case_insensitive_unique_idx
  on public.profiles (lower(username)) where username is not null;

create or replace function public.normalize_profile_identity()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.username := nullif(btrim(new.username), '');
  new.display_name := nullif(regexp_replace(btrim(new.display_name), '[[:space:]]+', ' ', 'g'), '');
  return new;
end;
$$;

drop trigger if exists normalize_profile_identity on public.profiles;
create trigger normalize_profile_identity
  before insert or update of username, display_name on public.profiles
  for each row execute procedure public.normalize_profile_identity();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users upload own avatars" on storage.objects;
drop policy if exists "Users list own avatars" on storage.objects;
drop policy if exists "Users update own avatars" on storage.objects;
drop policy if exists "Users delete own avatars" on storage.objects;
create policy "Users upload own avatars" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users list own avatars" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users update own avatars" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users delete own avatars" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function public.complete_profile_onboarding(
  profile_display_name text,
  profile_username text,
  profile_experience text,
  primary_goal text,
  interests jsonb,
  starting_language text,
  minutes_per_day integer,
  preferred_format text
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
  if profile_experience not in ('Completely new','I''ve tried a little','Beginner','Intermediate','Advanced') then raise exception 'Invalid experience level' using errcode = '22023'; end if;
  if primary_goal not in ('Build websites','Learn programming basics','Make games','Build mobile apps','Learn Python','Learn JavaScript','Prepare for school','Coding careers','Something else') then raise exception 'Invalid learning goal' using errcode = '22023'; end if;
  if starting_language not in ('html','css','javascript','python','cpp','swift','lua','help_me_choose') then raise exception 'Invalid starting language' using errcode = '22023'; end if;
  if minutes_per_day not in (10,20,30,45,60) or preferred_format not in ('guided_lessons','projects','quizzes','mixed') then raise exception 'Invalid learning preference' using errcode = '22023'; end if;

  update public.profiles set
    display_name = profile_display_name,
    username = profile_username,
    experience_level = profile_experience,
    learning_goal = primary_goal,
    preferred_language = starting_language,
    onboarding_complete = true,
    onboarding_completed = true,
    onboarding_required = false
  where id = current_user_id;

  if not found then raise exception 'Profile not found' using errcode = 'P0002'; end if;

  insert into public.learning_preferences (user_id, daily_minutes, learning_format, lesson_pace, explanation_style, practice_frequency)
  values (current_user_id, minutes_per_day, preferred_format,
    case when minutes_per_day >= 45 then 'fast' else 'balanced' end,
    case when preferred_format = 'guided_lessons' then 'step_by_step' else 'short' end,
    case when preferred_format in ('quizzes','mixed') then 'frequent' else 'normal' end)
  on conflict (user_id) do update set
    daily_minutes = excluded.daily_minutes,
    learning_format = excluded.learning_format,
    lesson_pace = excluded.lesson_pace,
    explanation_style = excluded.explanation_style,
    practice_frequency = excluded.practice_frequency;

  delete from public.learning_goals where user_id = current_user_id;
  insert into public.learning_goals (user_id, goal)
  select current_user_id, value
  from (select primary_goal as value union select jsonb_array_elements_text(coalesce(interests, '[]'::jsonb))) goals
  where char_length(value) between 2 and 80;
end;
$$;

revoke all on function public.complete_profile_onboarding(text,text,text,text,jsonb,text,integer,text) from public;
grant execute on function public.complete_profile_onboarding(text,text,text,text,jsonb,text,integer,text) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  candidate_name text;
begin
  candidate_name := coalesce(nullif(metadata->>'display_name',''), nullif(metadata->>'full_name',''), nullif(metadata->>'name',''));
  insert into public.profiles (id, email, display_name, avatar_url, avatar_source, onboarding_required)
  values (
    new.id,
    new.email,
    case when public.is_safe_display_name(candidate_name) then candidate_name else null end,
    coalesce(nullif(metadata->>'avatar_url',''), nullif(metadata->>'picture','')),
    'provider',
    true
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    updated_at = now();

  insert into public.privacy_preferences (user_id, model_improvement_opt_in, ai_personalization_enabled)
  values (new.id, false, true) on conflict (user_id) do nothing;
  insert into public.learning_preferences (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;
