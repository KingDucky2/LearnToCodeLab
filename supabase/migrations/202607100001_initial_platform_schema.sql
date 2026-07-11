create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text unique,
  avatar_url text,
  role text not null default 'learner',
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.privacy_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  model_improvement_opt_in boolean not null default false,
  ai_personalization_enabled boolean not null default true,
  cookie_preference text not null default 'essential',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  goal text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.language_experience (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  language_slug text not null,
  experience_level text not null,
  created_at timestamptz not null default now(),
  unique(user_id, language_slug)
);

create table if not exists public.learning_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  explanation_style text not null default 'step_by_step',
  lesson_pace text not null default 'balanced',
  practice_frequency text not null default 'normal',
  hint_behavior text not null default 'progressive',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_paths (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  color text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  learning_path_id uuid not null references public.learning_paths(id) on delete cascade,
  title text not null,
  level text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  slug text not null,
  title text not null,
  objective text not null,
  difficulty text not null default 'foundation',
  estimated_minutes integer not null default 20,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(module_id, slug)
);

create table if not exists public.lesson_sections (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  section_type text not null,
  title text not null,
  body text not null,
  code_example text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  language_slug text not null,
  topic text not null,
  question_type text not null,
  prompt text not null,
  choices jsonb not null default '[]'::jsonb,
  correct_answer text not null,
  explanation text not null,
  mistake_category text,
  difficulty text not null default 'foundation',
  created_at timestamptz not null default now()
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  attempt_type text not null,
  language_slug text,
  score numeric,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  question_id uuid references public.questions(id) on delete set null,
  selected_answer text,
  is_correct boolean not null default false,
  hints_used integer not null default 0,
  confidence text,
  mistake_category text,
  created_at timestamptz not null default now()
);

create table if not exists public.skill_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  language_slug text not null,
  topic text not null,
  mastery numeric not null default 0,
  updated_at timestamptz not null default now(),
  unique(user_id, language_slug, topic)
);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  status text not null default 'not_started',
  completed_sections jsonb not null default '[]'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(user_id, lesson_id)
);

alter table public.profiles enable row level security;
alter table public.privacy_preferences enable row level security;
alter table public.learning_goals enable row level security;
alter table public.language_experience enable row level security;
alter table public.learning_preferences enable row level security;
alter table public.attempts enable row level security;
alter table public.attempt_answers enable row level security;
alter table public.skill_scores enable row level security;
alter table public.lesson_progress enable row level security;

alter table public.learning_paths enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_sections enable row level security;
alter table public.questions enable row level security;

create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can read own privacy preferences" on public.privacy_preferences for select using (auth.uid() = user_id);
create policy "Users can update own privacy preferences" on public.privacy_preferences for update using (auth.uid() = user_id);
create policy "Users can manage own goals" on public.learning_goals for all using (auth.uid() = user_id);
create policy "Users can manage own language experience" on public.language_experience for all using (auth.uid() = user_id);
create policy "Users can manage own learning preferences" on public.learning_preferences for all using (auth.uid() = user_id);
create policy "Users can manage own attempts" on public.attempts for all using (auth.uid() = user_id);
create policy "Users can manage own skill scores" on public.skill_scores for all using (auth.uid() = user_id);
create policy "Users can manage own lesson progress" on public.lesson_progress for all using (auth.uid() = user_id);

create policy "Published curriculum is readable" on public.learning_paths for select using (true);
create policy "Published modules are readable" on public.modules for select using (true);
create policy "Published lessons are readable" on public.lessons for select using (true);
create policy "Published lesson sections are readable" on public.lesson_sections for select using (true);
create policy "Published questions are readable" on public.questions for select using (true);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;

  insert into public.privacy_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.learning_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
