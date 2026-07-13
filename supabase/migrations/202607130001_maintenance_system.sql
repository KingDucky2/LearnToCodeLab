create table if not exists public.site_settings (
  id text primary key default 'global' check (id = 'global'),
  maintenance_enabled boolean not null default false,
  maintenance_title text not null default 'The lab is getting upgraded.',
  maintenance_message text not null default 'LearnToCode Lab is temporarily offline while improvements are installed.',
  maintenance_status text not null default 'upgrading',
  maintenance_badge_text text not null default 'Scheduled maintenance',
  estimated_return_at timestamptz,
  show_countdown boolean not null default false,
  show_progress boolean not null default true,
  progress_percent integer not null default 35 check (progress_percent between 0 and 100),
  allow_admin_bypass boolean not null default true,
  allow_authenticated_users boolean not null default false,
  allow_login_during_maintenance boolean not null default true,
  show_personalized_message boolean not null default true,
  show_saved_progress_message boolean not null default true,
  auto_refresh_enabled boolean not null default true,
  auto_refresh_interval_seconds integer not null default 60 check (auto_refresh_interval_seconds between 15 and 3600),
  support_message text,
  contact_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.maintenance_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  description text,
  status text not null default 'waiting' check (status in ('waiting', 'in_progress', 'completed', 'delayed')),
  progress_percent integer check (progress_percent between 0 and 100),
  display_order integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.maintenance_updates (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  message text not null,
  published_at timestamptz not null default now(),
  visible boolean not null default true
);

insert into public.site_settings (id) values ('global') on conflict (id) do nothing;

insert into public.maintenance_tasks (title, description, status, progress_percent, display_order)
select * from (values
  ('Platform updates', 'Deploying reliability and security improvements.', 'in_progress', 70, 10),
  ('Learning paths', 'Checking lessons, quizzes, and saved progress.', 'waiting', 20, 20),
  ('Final verification', 'Testing the site before reopening the lab.', 'waiting', 0, 30)
) as seed(title, description, status, progress_percent, display_order)
where not exists (select 1 from public.maintenance_tasks);

alter table public.site_settings enable row level security;
alter table public.maintenance_tasks enable row level security;
alter table public.maintenance_updates enable row level security;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('learner', 'user', 'moderator', 'admin', 'owner'));

create or replace function public.is_site_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'owner')
  );
$$;

revoke all on function public.is_site_admin() from public;
grant execute on function public.is_site_admin() to authenticated;

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
  )
  from public.site_settings s where s.id = 'global';
$$;

grant execute on function public.get_public_maintenance_state() to anon, authenticated;

create or replace function public.save_maintenance_configuration(
  settings_payload jsonb,
  tasks_payload jsonb,
  updates_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_site_admin() then
    raise exception 'Administrator access is required' using errcode = '42501';
  end if;

  update public.site_settings set
    maintenance_enabled = (settings_payload->>'maintenance_enabled')::boolean,
    maintenance_title = settings_payload->>'maintenance_title',
    maintenance_message = settings_payload->>'maintenance_message',
    maintenance_status = settings_payload->>'maintenance_status',
    maintenance_badge_text = settings_payload->>'maintenance_badge_text',
    estimated_return_at = nullif(settings_payload->>'estimated_return_at', '')::timestamptz,
    show_countdown = (settings_payload->>'show_countdown')::boolean,
    show_progress = (settings_payload->>'show_progress')::boolean,
    progress_percent = (settings_payload->>'progress_percent')::integer,
    allow_admin_bypass = (settings_payload->>'allow_admin_bypass')::boolean,
    allow_authenticated_users = (settings_payload->>'allow_authenticated_users')::boolean,
    allow_login_during_maintenance = (settings_payload->>'allow_login_during_maintenance')::boolean,
    show_personalized_message = (settings_payload->>'show_personalized_message')::boolean,
    show_saved_progress_message = (settings_payload->>'show_saved_progress_message')::boolean,
    auto_refresh_enabled = (settings_payload->>'auto_refresh_enabled')::boolean,
    auto_refresh_interval_seconds = (settings_payload->>'auto_refresh_interval_seconds')::integer,
    support_message = nullif(settings_payload->>'support_message', ''),
    contact_email = nullif(settings_payload->>'contact_email', ''),
    updated_by = auth.uid()
  where id = 'global';

  delete from public.maintenance_tasks
  where id not in (select item.id from jsonb_to_recordset(tasks_payload) as item(id uuid));

  insert into public.maintenance_tasks (id, title, description, status, progress_percent, display_order, visible)
  select item.id, item.title, item.description, item.status, item.progress_percent, item.display_order, item.visible
  from jsonb_to_recordset(tasks_payload) as item(
    id uuid,
    title text,
    description text,
    status text,
    progress_percent integer,
    display_order integer,
    visible boolean
  )
  on conflict (id) do update set
    title = excluded.title,
    description = excluded.description,
    status = excluded.status,
    progress_percent = excluded.progress_percent,
    display_order = excluded.display_order,
    visible = excluded.visible;

  delete from public.maintenance_updates
  where id not in (select item.id from jsonb_to_recordset(updates_payload) as item(id uuid));

  insert into public.maintenance_updates (id, title, message, published_at, visible)
  select item.id, item.title, item.message, item.published_at, item.visible
  from jsonb_to_recordset(updates_payload) as item(
    id uuid,
    title text,
    message text,
    published_at timestamptz,
    visible boolean
  )
  on conflict (id) do update set
    title = excluded.title,
    message = excluded.message,
    published_at = excluded.published_at,
    visible = excluded.visible;
end;
$$;

revoke all on function public.save_maintenance_configuration(jsonb, jsonb, jsonb) from public;
grant execute on function public.save_maintenance_configuration(jsonb, jsonb, jsonb) to authenticated;

drop policy if exists "Admins manage site settings" on public.site_settings;
create policy "Admins manage site settings" on public.site_settings
  for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());

drop policy if exists "Visible maintenance tasks are public" on public.maintenance_tasks;
drop policy if exists "Admins can read hidden maintenance tasks" on public.maintenance_tasks;
drop policy if exists "Admins manage maintenance tasks" on public.maintenance_tasks;
create policy "Visible maintenance tasks are public" on public.maintenance_tasks
  for select to anon, authenticated using (visible);
create policy "Admins can read hidden maintenance tasks" on public.maintenance_tasks
  for select to authenticated using (public.is_site_admin());
create policy "Admins manage maintenance tasks" on public.maintenance_tasks
  for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());

drop policy if exists "Visible maintenance updates are public" on public.maintenance_updates;
drop policy if exists "Admins can read hidden maintenance updates" on public.maintenance_updates;
drop policy if exists "Admins manage maintenance updates" on public.maintenance_updates;
create policy "Visible maintenance updates are public" on public.maintenance_updates
  for select to anon, authenticated using (visible);
create policy "Admins can read hidden maintenance updates" on public.maintenance_updates
  for select to authenticated using (public.is_site_admin());
create policy "Admins manage maintenance updates" on public.maintenance_updates
  for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());

drop trigger if exists set_site_settings_updated_at on public.site_settings;
create trigger set_site_settings_updated_at before update on public.site_settings
  for each row execute procedure public.set_updated_at();
drop trigger if exists set_maintenance_tasks_updated_at on public.maintenance_tasks;
create trigger set_maintenance_tasks_updated_at before update on public.maintenance_tasks
  for each row execute procedure public.set_updated_at();
