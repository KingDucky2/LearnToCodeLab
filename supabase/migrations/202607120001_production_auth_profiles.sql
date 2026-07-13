alter table public.profiles
  add column if not exists display_name text,
  add column if not exists bio text,
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists preferred_language text,
  add column if not exists experience_level text,
  add column if not exists learning_goal text,
  add column if not exists updated_at timestamptz not null default now();

update public.profiles
set onboarding_completed = onboarding_complete
where onboarding_completed is distinct from onboarding_complete;

create unique index if not exists profiles_username_unique_idx on public.profiles (username) where username is not null;
create index if not exists profiles_created_at_idx on public.profiles (created_at);

alter table public.profiles
  add constraint profiles_username_format_check
  check (username is null or username ~ '^[a-z0-9_]{3,24}$') not valid;

alter table public.profiles
  validate constraint profiles_username_format_check;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata jsonb;
  fallback_name text;
begin
  metadata := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  fallback_name := nullif(split_part(coalesce(new.email, ''), '@', 1), '');

  insert into public.profiles (
    id,
    email,
    display_name,
    avatar_url
  )
  values (
    new.id,
    new.email,
    coalesce(
      nullif(metadata->>'display_name', ''),
      nullif(metadata->>'full_name', ''),
      nullif(metadata->>'name', ''),
      fallback_name
    ),
    coalesce(nullif(metadata->>'avatar_url', ''), nullif(metadata->>'picture', ''))
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    updated_at = now();

  insert into public.privacy_preferences (user_id, model_improvement_opt_in, ai_personalization_enabled)
  values (new.id, false, true)
  on conflict (user_id) do nothing;

  insert into public.learning_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;

create policy "Users can read own profile" on public.profiles
  for select to authenticated
  using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert to authenticated
  with check (auth.uid() = id);
