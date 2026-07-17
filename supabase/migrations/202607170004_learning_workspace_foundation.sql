-- Learning workspace foundation: forward-only and safe for existing accounts.

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 2 and 120),
  description text not null check (char_length(description) between 10 and 1000),
  icon text not null default 'Code2',
  difficulty text not null check (difficulty in ('Beginner','Intermediate','Advanced')),
  estimated_minutes integer not null default 0 check (estimated_minutes >= 0),
  status text not null default 'coming_soon' check (status in ('available','coming_soon')),
  sort_order integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 2 and 120),
  description text not null check (char_length(description) between 5 and 1000),
  status text not null default 'coming_soon' check (status in ('available','coming_soon')),
  sort_order integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, slug)
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.course_modules(id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 2 and 160),
  subtitle text not null default '',
  description text not null check (char_length(description) between 10 and 2000),
  difficulty text not null check (difficulty in ('Beginner','Intermediate','Advanced')),
  estimated_minutes integer not null check (estimated_minutes between 1 and 600),
  objectives jsonb not null default '[]'::jsonb check (jsonb_typeof(objectives) = 'array'),
  content jsonb not null default '{}'::jsonb check (jsonb_typeof(content) = 'object'),
  starter_files jsonb not null default '[]'::jsonb check (jsonb_typeof(starter_files) = 'array'),
  validation_rules jsonb not null default '[]'::jsonb check (jsonb_typeof(validation_rules) = 'array'),
  xp_reward integer not null default 0 check (xp_reward >= 0),
  sort_order integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, slug)
);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('not_started','in_progress','completed')),
  completion_percent integer not null default 0 check (completion_percent between 0 and 100),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  last_opened_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table if not exists public.lesson_code (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  file_name text not null check (file_name ~ '^[A-Za-z0-9][A-Za-z0-9._/-]{0,119}$' and position('..' in file_name) = 0),
  content text not null check (octet_length(content) <= 600000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id, file_name)
);

create index if not exists course_modules_course_sort_idx on public.course_modules(course_id, sort_order);
create index if not exists lessons_module_sort_idx on public.lessons(module_id, sort_order);
create index if not exists lesson_progress_user_recent_idx on public.lesson_progress(user_id, last_opened_at desc);
create index if not exists lesson_progress_user_status_idx on public.lesson_progress(user_id, status);
create index if not exists lesson_code_user_lesson_idx on public.lesson_code(user_id, lesson_id);

alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.lesson_code enable row level security;

grant select on public.courses, public.course_modules, public.lessons to anon, authenticated;
grant select, insert, update on public.lesson_progress to authenticated;
grant select, insert, update, delete on public.lesson_code to authenticated;

drop policy if exists "Published courses are readable" on public.courses;
create policy "Published courses are readable" on public.courses for select using (published);
drop policy if exists "Published modules are readable" on public.course_modules;
create policy "Published modules are readable" on public.course_modules for select using (published and exists (select 1 from public.courses c where c.id = course_id and c.published));
drop policy if exists "Published lessons are readable" on public.lessons;
create policy "Published lessons are readable" on public.lessons for select using (published and exists (select 1 from public.course_modules m join public.courses c on c.id = m.course_id where m.id = module_id and m.published and c.published));

drop policy if exists "Learners read own lesson progress" on public.lesson_progress;
create policy "Learners read own lesson progress" on public.lesson_progress for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Learners insert own lesson progress" on public.lesson_progress;
create policy "Learners insert own lesson progress" on public.lesson_progress for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Learners update own lesson progress" on public.lesson_progress;
create policy "Learners update own lesson progress" on public.lesson_progress for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Learners read own lesson code" on public.lesson_code;
create policy "Learners read own lesson code" on public.lesson_code for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Learners insert own lesson code" on public.lesson_code;
create policy "Learners insert own lesson code" on public.lesson_code for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Learners update own lesson code" on public.lesson_code;
create policy "Learners update own lesson code" on public.lesson_code for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Learners delete own lesson code" on public.lesson_code;
create policy "Learners delete own lesson code" on public.lesson_code for delete to authenticated using (auth.uid() = user_id);

insert into public.courses(id, slug, title, description, icon, difficulty, estimated_minutes, status, sort_order, published)
values ('11111111-1111-4111-8111-111111111101', 'web-development-foundations', 'Web Development Foundations', 'Build accessible web pages with HTML, style them with CSS, and add behavior with JavaScript.', 'Code2', 'Beginner', 720, 'available', 1, true)
on conflict (id) do update set title = excluded.title, description = excluded.description, icon = excluded.icon, difficulty = excluded.difficulty, estimated_minutes = excluded.estimated_minutes, status = excluded.status, sort_order = excluded.sort_order, published = excluded.published, updated_at = now();

insert into public.course_modules(id, course_id, slug, title, description, status, sort_order, published) values
  ('22222222-2222-4222-8222-222222222201', '11111111-1111-4111-8111-111111111101', 'introduction', 'Introduction', 'Understand the web and create your first HTML structure.', 'available', 1, true),
  ('22222222-2222-4222-8222-222222222202', '11111111-1111-4111-8111-111111111101', 'html-basics', 'HTML Basics', 'Create complete pages with clear content hierarchy.', 'available', 2, true),
  ('22222222-2222-4222-8222-222222222203', '11111111-1111-4111-8111-111111111101', 'css-basics', 'CSS Basics', 'Style and lay out responsive pages.', 'coming_soon', 3, true),
  ('22222222-2222-4222-8222-222222222204', '11111111-1111-4111-8111-111111111101', 'javascript-basics', 'JavaScript Basics', 'Add interaction and browser behavior.', 'coming_soon', 4, true)
on conflict (id) do update set title = excluded.title, description = excluded.description, status = excluded.status, sort_order = excluded.sort_order, published = excluded.published, updated_at = now();

insert into public.lessons(id, module_id, slug, title, subtitle, description, difficulty, estimated_minutes, objectives, content, starter_files, validation_rules, xp_reward, sort_order, published) values
  ('33333333-3333-4333-8333-333333333301', '22222222-2222-4222-8222-222222222201', 'what-is-html', 'What is HTML?', 'Meet the language that gives every web page its structure.', 'Learn how elements, tags, and document structure work together, then make your first meaningful edit in the browser.', 'Beginner', 18, '["Explain what HTML does","Recognize opening and closing tags","Identify the head and body of a document","Run a page in the live preview"]', '{"content_key":"what-is-html"}', '[{"name":"index.html","language":"html","editable":true},{"name":"styles.css","language":"css","editable":true},{"name":"script.js","language":"javascript","editable":true}]', '[{"type":"html_element","tag":"h1"},{"type":"html_element","tag":"p"},{"type":"required_text","text":"Hello, web!"}]', 25, 1, true),
  ('33333333-3333-4333-8333-333333333302', '22222222-2222-4222-8222-222222222202', 'creating-your-first-web-page', 'Creating Your First Web Page', 'Build a valid document from metadata to visible content.', 'Practice the durable page skeleton used by real websites and learn why each structural element belongs where it does.', 'Beginner', 24, '["Create a valid HTML document","Set a useful browser-tab title","Separate metadata from visible content","Connect CSS and JavaScript files"]', '{"content_key":"creating-your-first-web-page"}', '[{"name":"index.html","language":"html","editable":true},{"name":"styles.css","language":"css","editable":true},{"name":"script.js","language":"javascript","editable":true}]', '[{"type":"html_attribute","tag":"html","attribute":"lang","value":"en"},{"type":"required_text","text":"My learning journal"},{"type":"html_element","tag":"p"}]', 35, 1, true),
  ('33333333-3333-4333-8333-333333333303', '22222222-2222-4222-8222-222222222202', 'headings-paragraphs-and-text', 'Headings, Paragraphs, and Text', 'Turn a blank page into readable, meaningful content.', 'Use heading levels, paragraphs, and inline emphasis to create a clear content hierarchy that works for every reader.', 'Beginner', 26, '["Build a logical heading hierarchy","Group ideas into paragraphs","Use strong and emphasis semantically","Check the result at multiple preview widths"]', '{"content_key":"headings-paragraphs-and-text"}', '[{"name":"index.html","language":"html","editable":true},{"name":"styles.css","language":"css","editable":true},{"name":"script.js","language":"javascript","editable":true}]', '[{"type":"html_element","tag":"h1"},{"type":"html_element","tag":"h2","minimum":2},{"type":"html_element","tag":"p","minimum":2},{"type":"html_element","tag":"strong"},{"type":"html_element","tag":"em"}]', 40, 2, true)
on conflict (id) do update set title = excluded.title, subtitle = excluded.subtitle, description = excluded.description, difficulty = excluded.difficulty, estimated_minutes = excluded.estimated_minutes, objectives = excluded.objectives, content = excluded.content, starter_files = excluded.starter_files, validation_rules = excluded.validation_rules, xp_reward = excluded.xp_reward, sort_order = excluded.sort_order, published = excluded.published, updated_at = now();

create or replace function public.save_lesson_workspace(
  course_slug text,
  module_slug text,
  lesson_slug text,
  code_files jsonb,
  mark_completed boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_lesson_id uuid;
  target_starter_files jsonb;
  file_record record;
begin
  if current_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if jsonb_typeof(code_files) <> 'object' then raise exception 'Code files must be an object' using errcode = '22023'; end if;
  select l.id, l.starter_files into target_lesson_id, target_starter_files
  from public.lessons l
  join public.course_modules m on m.id = l.module_id
  join public.courses c on c.id = m.course_id
  where c.slug = course_slug and m.slug = module_slug and l.slug = lesson_slug
    and c.published and m.published and l.published;
  if target_lesson_id is null then raise exception 'Lesson not found' using errcode = 'P0002'; end if;

  for file_record in select key as file_name, value as content from jsonb_each_text(code_files) loop
    if octet_length(file_record.content) > 600000 or not exists (
      select 1 from jsonb_array_elements(target_starter_files) file_definition
      where file_definition->>'name' = file_record.file_name
        and coalesce((file_definition->>'editable')::boolean, false)
    ) then
      raise exception 'Invalid lesson file' using errcode = '22023';
    end if;
    insert into public.lesson_code(user_id, lesson_id, file_name, content)
    values(current_user_id, target_lesson_id, file_record.file_name, file_record.content)
    on conflict (user_id, lesson_id, file_name) do update set content = excluded.content, updated_at = now();
  end loop;

  insert into public.lesson_progress(user_id, lesson_id, status, completion_percent, completed_at, last_opened_at)
  values(current_user_id, target_lesson_id, case when mark_completed then 'completed' else 'in_progress' end, case when mark_completed then 100 else 0 end, case when mark_completed then now() else null end, now())
  on conflict (user_id, lesson_id) do update set
    status = case when lesson_progress.status = 'completed' or mark_completed then 'completed' else 'in_progress' end,
    completion_percent = case when lesson_progress.status = 'completed' or mark_completed then 100 else lesson_progress.completion_percent end,
    completed_at = case when lesson_progress.completed_at is not null then lesson_progress.completed_at when mark_completed then now() else null end,
    last_opened_at = now(),
    updated_at = now();
end;
$$;

revoke all on function public.save_lesson_workspace(text,text,text,jsonb,boolean) from public;
grant execute on function public.save_lesson_workspace(text,text,text,jsonb,boolean) to authenticated;
