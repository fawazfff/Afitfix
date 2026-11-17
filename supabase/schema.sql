-- Afitfix MVP database schema.
-- Run this file first in Supabase SQL Editor.

create extension if not exists pgcrypto;

create type public.user_role as enum ('student', 'admin');
create type public.complaint_status as enum (
  'submitted','under_review','assigned','in_progress',
  'awaiting_confirmation','resolved','reopened'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'Student',
  email text not null,
  matric_number text,
  role public.user_role not null default 'student',
  created_at timestamptz not null default now()
);

create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  tracking_code text not null unique default ('AF-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 5 and 120),
  description text not null check (char_length(description) between 10 and 3000),
  category text not null check (category in ('Electricity','Water & Plumbing','Classroom','Hostel','Laboratory','Cleanliness','Internet','Other')),
  location text not null check (char_length(location) between 2 and 160),
  image_url text,
  status public.complaint_status not null default 'submitted',
  resolution_note text,
  resolution_image_url text,
  student_feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.complaint_comments (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);

create table public.complaint_votes (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (complaint_id,user_id)
);

create table public.complaint_status_history (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  changed_by uuid not null references public.profiles(id),
  old_status public.complaint_status,
  new_status public.complaint_status not null,
  note text,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  complaint_id uuid references public.complaints(id) on delete cascade,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index complaints_created_at_idx on public.complaints(created_at desc);
create index complaints_status_idx on public.complaints(status);
create index complaints_user_id_idx on public.complaints(user_id);
create index comments_complaint_created_idx on public.complaint_comments(complaint_id,created_at);
create index comments_user_id_idx on public.complaint_comments(user_id);
create index status_history_complaint_id_idx on public.complaint_status_history(complaint_id);
create index status_history_changed_by_idx on public.complaint_status_history(changed_by);
create index votes_user_id_idx on public.complaint_votes(user_id);
create index notifications_user_created_idx on public.notifications(user_id,created_at desc);
create index notifications_complaint_id_idx on public.notifications(complaint_id);

-- This trigger creates a student profile at signup. User metadata is used only
-- for display fields, never for deciding permissions or admin status.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles(id,full_name,email,matric_number)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name',''),'Student'),
    new.email,
    nullif(new.raw_user_meta_data->>'matric_number','')
  );
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger complaints_set_updated_at
before update on public.complaints
for each row execute procedure public.set_updated_at();

-- Private helper prevents recursive profile RLS checks. The private schema
-- must not be added to Supabase's exposed API schemas.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.complaints enable row level security;
alter table public.complaint_comments enable row level security;
alter table public.complaint_votes enable row level security;
alter table public.complaint_status_history enable row level security;
alter table public.notifications enable row level security;

-- Students can read their own profile. Admins can read all profiles.
create policy "Users can read own profile and admins can read all"
on public.profiles for select to authenticated
using (id = (select auth.uid()) or private.is_admin());

create policy "Users can update their own basic profile"
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

revoke all on public.profiles from anon, authenticated;
grant select (id,full_name,role) on public.profiles to authenticated;
grant update (full_name,matric_number) on public.profiles to authenticated;

create policy "Authenticated users can read complaints"
on public.complaints for select to authenticated using (true);

create policy "Students can submit new complaints"
on public.complaints for insert to authenticated
with check (
  user_id = (select auth.uid())
  and status = 'submitted'
  and resolution_note is null
  and resolution_image_url is null
  and student_feedback is null
);

create policy "Admins can update complaints"
on public.complaints for update to authenticated
using (private.is_admin()) with check (private.is_admin());

create policy "Authenticated users can read comments"
on public.complaint_comments for select to authenticated using (true);

create policy "Users can add their own comments"
on public.complaint_comments for insert to authenticated
with check (user_id = (select auth.uid()));

create policy "Authors and admins can delete comments"
on public.complaint_comments for delete to authenticated
using (user_id = (select auth.uid()) or private.is_admin());

create policy "Authenticated users can read votes"
on public.complaint_votes for select to authenticated using (true);

create policy "Users can cast their own votes"
on public.complaint_votes for insert to authenticated
with check (user_id = (select auth.uid()));

create policy "Users can remove their own votes"
on public.complaint_votes for delete to authenticated
using (user_id = (select auth.uid()));

create policy "Authenticated users can read status history"
on public.complaint_status_history for select to authenticated using (true);

create policy "Admins can add status history"
on public.complaint_status_history for insert to authenticated
with check (private.is_admin());

create policy "Users can read their notifications"
on public.notifications for select to authenticated
using (user_id = (select auth.uid()));

create policy "Users can update their notification read state"
on public.notifications for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

revoke all on public.complaints, public.complaint_comments, public.complaint_votes,
  public.complaint_status_history, public.notifications from anon, authenticated;
grant usage on schema public to authenticated;
grant select on public.complaints, public.complaint_comments, public.complaint_votes,
  public.complaint_status_history, public.notifications to authenticated;
grant insert on public.complaints, public.complaint_comments, public.complaint_votes,
  public.complaint_status_history to authenticated;
grant delete on public.complaint_comments, public.complaint_votes to authenticated;
grant update on public.complaints to authenticated;
grant update (is_read) on public.notifications to authenticated;

-- First admin: register normally, then run as project owner in SQL Editor:
-- update public.profiles set role = 'admin' where email = 'your-admin-email@example.com';
-- Never expose admin promotion in the app.
