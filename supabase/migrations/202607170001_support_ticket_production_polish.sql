-- Production lifecycle additions for the existing support system.
-- This migration is additive and preserves every ticket, message, policy, and role.

alter table public.support_tickets
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.profiles(id) on delete set null,
  add column if not exists closed_at timestamptz,
  add column if not exists status_changed_at timestamptz not null default now(),
  add column if not exists status_changed_by uuid references public.profiles(id) on delete set null;

update public.support_tickets
set
  closed_at = case when status = 'closed' then coalesce(resolved_at, updated_at) else closed_at end,
  status_changed_at = coalesce(updated_at, created_at);

create index if not exists support_tickets_archived_updated_idx
  on public.support_tickets (archived_at, updated_at desc);
create index if not exists support_tickets_priority_updated_idx
  on public.support_tickets (priority, updated_at desc);

create table if not exists public.support_ticket_status_history (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  previous_status text not null check (previous_status in ('open', 'in_progress', 'waiting_on_user', 'resolved', 'closed')),
  new_status text not null check (new_status in ('open', 'in_progress', 'waiting_on_user', 'resolved', 'closed')),
  changed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists support_ticket_status_history_ticket_created_idx
  on public.support_ticket_status_history (ticket_id, created_at);

alter table public.support_ticket_status_history enable row level security;

grant select on public.support_ticket_status_history to authenticated;

create policy "Ticket participants read status history" on public.support_ticket_status_history
  for select to authenticated using (
    public.is_site_admin() or exists (
      select 1 from public.support_tickets ticket
      where ticket.id = ticket_id and ticket.user_id = auth.uid()
    )
  );

create or replace function public.admin_set_support_ticket_status(
  target_ticket_id uuid,
  next_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  old_status text;
begin
  if not public.is_site_admin() then
    raise exception 'Administrator access is required' using errcode = '42501';
  end if;
  if next_status not in ('open', 'in_progress', 'waiting_on_user', 'resolved', 'closed') then
    raise exception 'Invalid support status' using errcode = '22023';
  end if;

  select status into old_status
  from public.support_tickets
  where id = target_ticket_id
  for update;

  if old_status is null then
    raise exception 'Support ticket not found' using errcode = 'P0002';
  end if;
  if old_status = next_status then return; end if;

  update public.support_tickets
  set
    status = next_status,
    status_changed_at = now(),
    status_changed_by = auth.uid(),
    needs_staff_attention = next_status = 'open',
    resolved_at = case
      when next_status = 'resolved' then now()
      when next_status in ('open', 'in_progress', 'waiting_on_user') then null
      else resolved_at
    end,
    closed_at = case when next_status = 'closed' then now() else null end
  where id = target_ticket_id;

  insert into public.support_ticket_status_history (
    ticket_id, previous_status, new_status, changed_by
  ) values (
    target_ticket_id, old_status, next_status, auth.uid()
  );
end;
$$;

revoke all on function public.admin_set_support_ticket_status(uuid, text) from public;
grant execute on function public.admin_set_support_ticket_status(uuid, text) to authenticated;

create or replace function public.admin_set_support_ticket_archived(
  target_ticket_id uuid,
  should_archive boolean
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

  update public.support_tickets
  set
    archived_at = case when should_archive then now() else null end,
    archived_by = case when should_archive then auth.uid() else null end
  where id = target_ticket_id;

  if not found then
    raise exception 'Support ticket not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.admin_set_support_ticket_archived(uuid, boolean) from public;
grant execute on function public.admin_set_support_ticket_archived(uuid, boolean) to authenticated;

create or replace function public.close_own_support_ticket(target_ticket_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  old_status text;
begin
  select status into old_status
  from public.support_tickets
  where id = target_ticket_id and user_id = auth.uid()
  for update;

  if old_status is distinct from 'resolved' then
    raise exception 'Only your own resolved ticket can be closed' using errcode = '42501';
  end if;

  update public.support_tickets
  set status = 'closed', closed_at = now(), status_changed_at = now(), status_changed_by = auth.uid()
  where id = target_ticket_id;

  insert into public.support_ticket_status_history (
    ticket_id, previous_status, new_status, changed_by
  ) values (
    target_ticket_id, old_status, 'closed', auth.uid()
  );
end;
$$;

revoke all on function public.close_own_support_ticket(uuid) from public;
grant execute on function public.close_own_support_ticket(uuid) to authenticated;
