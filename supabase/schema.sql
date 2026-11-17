-- Afitfix MVP database schema.
-- Run this entire file in Supabase Dashboard > SQL Editor.
-- Safe to run repeatedly on a fresh or already initialized Afitfix database.

create extension if not exists pgcrypto;

do $$
begin
  create type public.user_role as enum ('student', 'admin');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.complaint_status as enum (
    'submitted',
    'under_review',
    'assigned',
    'in_progress',
    'awaiting_confirmation',
    'resolved',
    'reopened'
  );
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'Student',
  email text not null,
  matric_number text,
  role public.user_role not null default 'student',
  created_at timestamptz not null default now()
);

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  tracking_code text not null unique default ('AF-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 5 and 120),
  description text not null check (char_length(description) between 10 and 3000),
  category text not null check (category in ('Electricity', 'Water & Plumbing', 'Classroom', 'Hostel', 'Laboratory', 'Cleanliness', 'Internet', 'Other')),
  location text not null check (char_length(location) between 2 and 160),
  image_url text,
  status public.complaint_status not null default 'submitted',
  resolution_note text,
  resolution_image_url text,
  student_feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.complaint_comments (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);

create table if not exists public.complaint_votes (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (complaint_id, user_id)
);

create table if not exists public.complaint_status_history (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  changed_by uuid not null references public.profiles(id),
  old_status public.complaint_status,
  new_status public.complaint_status not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  complaint_id uuid references public.complaints(id) on delete cascade,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists complaints_created_at_idx on public.complaints (created_at desc);
create index if not exists complaints_status_idx on public.complaints (status);
create index if not exists comments_complaint_created_idx on public.complaint_comments (complaint_id, created_at);
create index if not exists notifications_user_created_idx on public.notifications (user_id, created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, matric_number)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Student'),
    new.email,
    nullif(new.raw_user_meta_data ->> 'matric_number', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- A SECURITY DEFINER helper avoids recursive profile RLS checks.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists complaints_set_updated_at on public.complaints;
create trigger complaints_set_updated_at
  before update on public.complaints
  for each row execute procedure public.set_updated_at();

-- One RPC call performs both writes in one database transaction.
-- SECURITY INVOKER preserves the table grants and RLS policies below.
create or replace function public.admin_update_complaint_status(
  p_complaint_id uuid,
  p_new_status public.complaint_status,
  p_note text default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_old_status public.complaint_status;
  v_admin_id uuid;
begin
  v_admin_id := (select auth.uid());

  if v_admin_id is null or not public.is_admin() then
    raise exception 'Only administrators can update report statuses.'
      using errcode = '42501';
  end if;

  select status
    into v_old_status
    from public.complaints
    where id = p_complaint_id
    for update;

  if not found then
    raise exception 'Report not found.' using errcode = 'P0002';
  end if;

  if v_old_status is not distinct from p_new_status then
    return;
  end if;

  update public.complaints
    set status = p_new_status,
        resolution_note = case
          when p_new_status = 'resolved' and nullif(trim(p_note), '') is not null
            then trim(p_note)
          else resolution_note
        end
    where id = p_complaint_id;

  insert into public.complaint_status_history (
    complaint_id, changed_by, old_status, new_status, note
  )
  values (
    p_complaint_id, v_admin_id, v_old_status, p_new_status, nullif(trim(p_note), '')
  );
end;
$$;

revoke all on function public.admin_update_complaint_status(uuid, public.complaint_status, text) from public;
grant execute on function public.admin_update_complaint_status(uuid, public.complaint_status, text) to authenticated;

alter table public.profiles enable row level security;
alter table public.complaints enable row level security;
alter table public.complaint_comments enable row level security;
alter table public.complaint_votes enable row level security;
alter table public.complaint_status_history enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "Authenticated users can read profiles" on public.profiles;
create policy "Authenticated users can read profiles"
  on public.profiles for select to authenticated
  using (true);

drop policy if exists "Users can update their own basic profile" on public.profiles;
create policy "Users can update their own basic profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

revoke update on public.profiles from authenticated;
grant update (full_name, matric_number) on public.profiles to authenticated;

drop policy if exists "Authenticated users can read complaints" on public.complaints;
create policy "Authenticated users can read complaints"
  on public.complaints for select to authenticated
  using (true);

drop policy if exists "Students can submit complaints" on public.complaints;
create policy "Students can submit complaints"
  on public.complaints for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Admins can update complaints" on public.complaints;
create policy "Admins can update complaints"
  on public.complaints for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Authenticated users can read comments" on public.complaint_comments;
create policy "Authenticated users can read comments"
  on public.complaint_comments for select to authenticated
  using (true);

drop policy if exists "Users can add their own comments" on public.complaint_comments;
create policy "Users can add their own comments"
  on public.complaint_comments for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Authors and admins can delete comments" on public.complaint_comments;
create policy "Authors and admins can delete comments"
  on public.complaint_comments for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "Authenticated users can read votes" on public.complaint_votes;
create policy "Authenticated users can read votes"
  on public.complaint_votes for select to authenticated
  using (true);

drop policy if exists "Users can cast their own votes" on public.complaint_votes;
create policy "Users can cast their own votes"
  on public.complaint_votes for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can remove their own votes" on public.complaint_votes;
create policy "Users can remove their own votes"
  on public.complaint_votes for delete to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Authenticated users can read status history" on public.complaint_status_history;
create policy "Authenticated users can read status history"
  on public.complaint_status_history for select to authenticated
  using (true);

drop policy if exists "Admins can add status history" on public.complaint_status_history;
create policy "Admins can add status history"
  on public.complaint_status_history for insert to authenticated
  with check (public.is_admin());

drop policy if exists "Users can read their notifications" on public.notifications;
create policy "Users can read their notifications"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can update their notifications" on public.notifications;
create policy "Users can update their notifications"
  on public.notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant usage on schema public to authenticated;
grant select on public.profiles, public.complaints, public.complaint_comments,
  public.complaint_votes, public.complaint_status_history, public.notifications to authenticated;
grant insert on public.complaints, public.complaint_comments, public.complaint_votes,
  public.complaint_status_history to authenticated;
grant delete on public.complaint_comments, public.complaint_votes to authenticated;
grant update on public.complaints, public.notifications to authenticated;

-- Promote the first admin manually after signing up:
-- update public.profiles set role = 'admin' where email = 'your-admin-email@example.com';
-- Run that statement as the Supabase project owner in the SQL Editor, not from the app.
