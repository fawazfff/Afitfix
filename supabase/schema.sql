-- Afitfix MVP database schema
-- Run this entire file in Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create type public.user_role as enum ('student', 'admin');
create type public.complaint_status as enum (
  'submitted',
  'under_review',
  'assigned',
  'in_progress',
  'awaiting_confirmation',
  'resolved',
  'reopened'
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
  unique (complaint_id, user_id)
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

create index complaints_created_at_idx on public.complaints (created_at desc);
create index complaints_status_idx on public.complaints (status);
create index comments_complaint_created_idx on public.complaint_comments (complaint_id, created_at);
create index notifications_user_created_idx on public.notifications (user_id, created_at desc);

-- Automatically create a student profile whenever a user signs up.
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

grant execute on function public.is_admin() to authenticated;

-- Keep updated_at current on complaint changes.
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

create trigger complaints_set_updated_at
  before update on public.complaints
  for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.complaints enable row level security;
alter table public.complaint_comments enable row level security;
alter table public.complaint_votes enable row level security;
alter table public.complaint_status_history enable row level security;
alter table public.notifications enable row level security;

-- Profiles: students can read the community names, but only their own profile;
-- admins can review all profiles. Students cannot change their role.
create policy "Authenticated users can read profiles"
  on public.profiles for select to authenticated
  using (true);

create policy "Users can update their own basic profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

revoke update on public.profiles from authenticated;
grant update (full_name, matric_number) on public.profiles to authenticated;

-- Complaints are visible to signed-in students for the community feed.
create policy "Authenticated users can read complaints"
  on public.complaints for select to authenticated
  using (true);

create policy "Students can submit complaints"
  on public.complaints for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Admins can update complaints"
  on public.complaints for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Comments: signed-in users can read and contribute; authors/admins can delete.
create policy "Authenticated users can read comments"
  on public.complaint_comments for select to authenticated
  using (true);

create policy "Users can add their own comments"
  on public.complaint_comments for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Authors and admins can delete comments"
  on public.complaint_comments for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

-- Votes: one vote per user per report, enforced by the unique constraint.
create policy "Authenticated users can read votes"
  on public.complaint_votes for select to authenticated
  using (true);

create policy "Users can cast their own votes"
  on public.complaint_votes for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can remove their own votes"
  on public.complaint_votes for delete to authenticated
  using (user_id = (select auth.uid()));

-- Only admins can create status-history entries.
create policy "Authenticated users can read status history"
  on public.complaint_status_history for select to authenticated
  using (true);

create policy "Admins can add status history"
  on public.complaint_status_history for insert to authenticated
  with check (public.is_admin());

-- Notifications are private to their recipient.
create policy "Users can read their notifications"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can update their notifications"
  on public.notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Allow the app to access these tables through Supabase's Data API.
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
