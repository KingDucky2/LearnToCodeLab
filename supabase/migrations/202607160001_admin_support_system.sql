-- Admin user-management and learner support foundation.
-- Existing profiles remain active; privileged auth operations stay server-only.

alter table public.profiles
  add column if not exists account_status text not null default 'active',
  add column if not exists account_status_reason text,
  add column if not exists account_status_changed_at timestamptz,
  add column if not exists account_status_changed_by uuid references auth.users(id) on delete set null,
  add column if not exists auth_providers text[] not null default '{}'::text[];

alter table public.profiles drop constraint if exists profiles_account_status_check;
alter table public.profiles add constraint profiles_account_status_check
  check (account_status in ('active', 'suspended'));

create index if not exists profiles_account_status_idx on public.profiles (account_status);
create index if not exists profiles_email_lower_idx on public.profiles (lower(email));
create index if not exists profiles_auth_providers_idx on public.profiles using gin (auth_providers);

create or replace function public.is_site_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'owner'
  );
$$;

revoke all on function public.is_site_owner() from public;
grant execute on function public.is_site_owner() to authenticated;

-- A signed-in user may update only their non-privileged profile fields. This
-- closes the pre-existing possibility of changing role or account status via
-- the otherwise-correct own-row update policy.
revoke update on public.profiles from authenticated;
revoke insert on public.profiles from authenticated;
grant update (display_name, username, avatar_url, bio, onboarding_complete,
  onboarding_completed, preferred_language, experience_level, learning_goal,
  updated_at) on public.profiles to authenticated;
grant insert (id, email, display_name, username, avatar_url, bio,
  onboarding_complete, onboarding_completed, preferred_language,
  experience_level, learning_goal, created_at, updated_at) on public.profiles to authenticated;

create or replace function public.sync_profile_auth_providers()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set auth_providers = array_remove(array_cat(
    array(select jsonb_array_elements_text(coalesce(new.raw_app_meta_data->'providers', '[]'::jsonb))),
    array[new.raw_app_meta_data->>'provider']
  ), null), updated_at = now()
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists sync_profile_auth_providers on auth.users;
create trigger sync_profile_auth_providers
  after insert or update of raw_app_meta_data on auth.users
  for each row execute procedure public.sync_profile_auth_providers();

update public.profiles p
set auth_providers = array_remove(array_cat(
  coalesce((select array_agg(value) from auth.users u, jsonb_array_elements_text(coalesce(u.raw_app_meta_data->'providers', '[]'::jsonb)) value where u.id = p.id), '{}'::text[]),
  array[(select u.raw_app_meta_data->>'provider' from auth.users u where u.id = p.id)]
), null);

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number bigint generated always as identity unique,
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null check (char_length(subject) between 5 and 140),
  category text not null check (category in ('login_account', 'password_reset', 'bug', 'lesson_practice', 'feature_request', 'other')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'waiting_on_user', 'resolved', 'closed')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  needs_staff_attention boolean not null default true,
  page_url text check (page_url is null or char_length(page_url) <= 500),
  diagnostics jsonb,
  diagnostics_consent boolean not null default false,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null check (char_length(body) between 2 and 5000),
  author_kind text not null check (author_kind in ('learner', 'staff')),
  created_at timestamptz not null default now()
);

create table public.support_staff_notes (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null check (char_length(body) between 2 and 5000),
  created_at timestamptz not null default now()
);

create table public.account_status_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  previous_status text not null check (previous_status in ('active', 'suspended')),
  new_status text not null check (new_status in ('active', 'suspended')),
  reason text not null check (char_length(reason) between 3 and 500),
  created_at timestamptz not null default now()
);

create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_role text not null,
  action text not null check (char_length(action) between 3 and 100),
  target_type text not null check (char_length(target_type) between 2 and 50),
  target_id text,
  summary text not null check (char_length(summary) between 3 and 500),
  result text not null check (result in ('success', 'denied', 'failed')),
  correlation_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table public.user_staff_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null check (char_length(body) between 2 and 5000),
  created_at timestamptz not null default now()
);

create index support_tickets_user_created_idx on public.support_tickets (user_id, created_at desc);
create index support_tickets_status_updated_idx on public.support_tickets (status, updated_at desc);
create index support_tickets_assigned_idx on public.support_tickets (assigned_to, updated_at desc) where assigned_to is not null;
create index support_messages_ticket_created_idx on public.support_messages (ticket_id, created_at);
create index support_staff_notes_ticket_created_idx on public.support_staff_notes (ticket_id, created_at);
create index account_status_history_user_created_idx on public.account_status_history (user_id, created_at desc);
create index admin_audit_log_created_idx on public.admin_audit_log (created_at desc);
create index admin_audit_log_actor_idx on public.admin_audit_log (actor_id, created_at desc);
create index admin_audit_log_action_idx on public.admin_audit_log (action, created_at desc);
create index admin_audit_log_target_idx on public.admin_audit_log (target_id, created_at desc);
create index user_staff_notes_user_created_idx on public.user_staff_notes (user_id, created_at desc);

alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
alter table public.support_staff_notes enable row level security;
alter table public.account_status_history enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.user_staff_notes enable row level security;

create policy "Learners read own support tickets" on public.support_tickets
  for select to authenticated using (auth.uid() = user_id or public.is_site_admin());
create policy "Learners create own support tickets" on public.support_tickets
  for insert to authenticated with check (
    auth.uid() = user_id and status = 'open' and priority = 'normal' and needs_staff_attention
    and assigned_to is null and resolved_at is null
  );
create policy "Staff manage support tickets" on public.support_tickets
  for update to authenticated using (public.is_site_admin()) with check (public.is_site_admin());

create policy "Staff read user profiles" on public.profiles
  for select to authenticated using (public.is_site_admin());

create policy "Ticket participants read messages" on public.support_messages
  for select to authenticated using (
    public.is_site_admin() or exists (
      select 1 from public.support_tickets t
      where t.id = ticket_id and t.user_id = auth.uid()
    )
  );
create policy "Learners reply to own tickets" on public.support_messages
  for insert to authenticated with check (
    author_id = auth.uid() and author_kind = 'learner'
    and exists (
      select 1 from public.support_tickets t
      where t.id = ticket_id and t.user_id = auth.uid() and t.status in ('open', 'in_progress', 'waiting_on_user')
    )
  );
create policy "Staff reply to tickets" on public.support_messages
  for insert to authenticated with check (
    public.is_site_admin() and author_id = auth.uid() and author_kind = 'staff'
  );

create policy "Staff read private notes" on public.support_staff_notes
  for select to authenticated using (public.is_site_admin());
create policy "Staff append private notes" on public.support_staff_notes
  for insert to authenticated with check (public.is_site_admin() and author_id = auth.uid());

create policy "Staff read account history" on public.account_status_history
  for select to authenticated using (public.is_site_admin());
create policy "Staff append account history" on public.account_status_history
  for insert to authenticated with check (public.is_site_admin() and actor_id = auth.uid());

create policy "Staff read audit log" on public.admin_audit_log
  for select to authenticated using (public.is_site_admin());
create policy "Staff append audit log" on public.admin_audit_log
  for insert to authenticated with check (public.is_site_admin() and actor_id = auth.uid());

create policy "Staff read user notes" on public.user_staff_notes
  for select to authenticated using (public.is_site_admin());
create policy "Staff append user notes" on public.user_staff_notes
  for insert to authenticated with check (
    public.is_site_admin() and author_id = auth.uid() and user_id <> auth.uid()
    and exists (
      select 1 from public.profiles target
      where target.id = user_id and target.role <> 'owner'
        and (public.is_site_owner() or target.role <> 'admin')
    )
  );

create or replace function public.create_support_ticket(
  ticket_subject text, ticket_category text, initial_message text,
  related_page text default null, include_diagnostics boolean default false,
  diagnostic_payload jsonb default null
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare new_ticket_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if char_length(trim(ticket_subject)) not between 5 and 140 or char_length(trim(initial_message)) not between 10 and 5000 or ticket_category not in ('login_account', 'password_reset', 'bug', 'lesson_practice', 'feature_request', 'other') then raise exception 'Invalid support request' using errcode = '22023'; end if;
  if (select count(*) from public.support_tickets where user_id = auth.uid() and created_at >= now() - interval '5 minutes') >= 2 then raise exception 'Support request rate limit reached' using errcode = 'P0001'; end if;
  if exists (select 1 from public.support_tickets where user_id = auth.uid() and lower(subject) = lower(trim(ticket_subject)) and created_at >= now() - interval '24 hours' and status <> 'closed') then raise exception 'A matching support request is already open' using errcode = '23505'; end if;
  insert into public.support_tickets (user_id, subject, category, page_url, diagnostics_consent, diagnostics)
  values (auth.uid(), trim(ticket_subject), ticket_category, related_page, include_diagnostics, case when include_diagnostics then diagnostic_payload else null end)
  returning id into new_ticket_id;
  insert into public.support_messages (ticket_id, author_id, body, author_kind) values (new_ticket_id, auth.uid(), trim(initial_message), 'learner');
  return new_ticket_id;
end;
$$;

revoke all on function public.create_support_ticket(text, text, text, text, boolean, jsonb) from public;
grant execute on function public.create_support_ticket(text, text, text, text, boolean, jsonb) to authenticated;

create or replace function public.close_own_support_ticket(target_ticket_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  update public.support_tickets
  set status = 'closed'
  where id = target_ticket_id and user_id = auth.uid() and status = 'resolved';
  if not found then raise exception 'Only your own resolved ticket can be closed' using errcode = '42501'; end if;
end;
$$;

revoke all on function public.close_own_support_ticket(uuid) from public;
grant execute on function public.close_own_support_ticket(uuid) to authenticated;

create or replace function public.set_user_account_status(target_user_id uuid, next_status text, change_reason text)
returns void
language plpgsql security definer set search_path = public
as $$
declare actor_role text; target_role text; old_status text;
begin
  select role into actor_role from public.profiles where id = auth.uid();
  select role, account_status into target_role, old_status from public.profiles where id = target_user_id for update;
  if actor_role not in ('admin', 'owner') or next_status not in ('active', 'suspended') or char_length(trim(change_reason)) not between 3 and 500 then raise exception 'Invalid account status action' using errcode = '42501'; end if;
  if target_user_id = auth.uid() or target_role = 'owner' or (target_role = 'admin' and actor_role <> 'owner') then raise exception 'This account cannot be managed by the current actor' using errcode = '42501'; end if;
  update public.profiles set account_status = next_status, account_status_reason = trim(change_reason), account_status_changed_at = now(), account_status_changed_by = auth.uid() where id = target_user_id;
  insert into public.account_status_history (user_id, actor_id, previous_status, new_status, reason) values (target_user_id, auth.uid(), old_status, next_status, trim(change_reason));
end;
$$;

revoke all on function public.set_user_account_status(uuid, text, text) from public;
grant execute on function public.set_user_account_status(uuid, text, text) to authenticated;

create or replace function public.admin_revoke_user_sessions(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_role text;
begin
  if not public.is_site_admin() then
    raise exception 'Administrator access is required' using errcode = '42501';
  end if;
  select role into target_role from public.profiles where id = target_user_id;
  if target_role is null or target_role = 'owner' or target_user_id = auth.uid()
     or (target_role = 'admin' and not public.is_site_owner()) then
    raise exception 'This account cannot be managed by the current actor' using errcode = '42501';
  end if;
  delete from auth.sessions where user_id = target_user_id;
  delete from auth.refresh_tokens where user_id = target_user_id::text;
end;
$$;

revoke all on function public.admin_revoke_user_sessions(uuid) from public;
grant execute on function public.admin_revoke_user_sessions(uuid) to authenticated;

drop trigger if exists set_support_tickets_updated_at on public.support_tickets;
create trigger set_support_tickets_updated_at before update on public.support_tickets
  for each row execute procedure public.set_updated_at();

create or replace function public.touch_support_ticket_from_message()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  update public.support_tickets
  set updated_at = now(), needs_staff_attention = (new.author_kind = 'learner')
  where id = new.ticket_id;
  return new;
end;
$$;

drop trigger if exists touch_support_ticket_from_message on public.support_messages;
create trigger touch_support_ticket_from_message
  after insert on public.support_messages
  for each row execute procedure public.touch_support_ticket_from_message();

-- Notes, history, messages, and audit events intentionally have no update or
-- delete policies: they are append-only through authenticated application flows.
