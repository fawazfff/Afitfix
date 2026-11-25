-- Afitfix product expansion: profiles, admin notes, announcements and resolution feedback.
-- Apply once in the Supabase SQL Editor after the existing MVP schema.

alter table public.profiles
  add column if not exists avatar_url text;

grant select (matric_number, avatar_url, email, created_at) on public.profiles to authenticated;
grant update (avatar_url) on public.profiles to authenticated;

create table if not exists public.admin_report_notes (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  admin_id uuid not null references public.profiles(id),
  note text not null check (char_length(note) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists admin_report_notes_complaint_created_idx
  on public.admin_report_notes(complaint_id, created_at desc);
alter table public.admin_report_notes enable row level security;
revoke all on public.admin_report_notes from anon, authenticated;
grant select, insert on public.admin_report_notes to authenticated;
create policy "Admins can read report notes"
  on public.admin_report_notes for select to authenticated
  using (private.is_admin());
create policy "Admins can add report notes"
  on public.admin_report_notes for insert to authenticated
  with check (admin_id = (select auth.uid()) and private.is_admin());

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 140),
  body text not null check (char_length(body) between 3 and 3000),
  is_published boolean not null default false,
  is_pinned boolean not null default false,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists announcements_published_created_idx
  on public.announcements(is_published, is_pinned desc, created_at desc);
alter table public.announcements enable row level security;
revoke all on public.announcements from anon, authenticated;
grant select, insert, update, delete on public.announcements to authenticated;
create policy "Students can read published announcements and admins can read all"
  on public.announcements for select to authenticated
  using (is_published or private.is_admin());
create policy "Admins can create announcements"
  on public.announcements for insert to authenticated
  with check (created_by = (select auth.uid()) and private.is_admin());
create policy "Admins can update announcements"
  on public.announcements for update to authenticated
  using (private.is_admin()) with check (private.is_admin());
create policy "Admins can delete announcements"
  on public.announcements for delete to authenticated
  using (private.is_admin());

create or replace function public.student_confirm_resolution(
  p_complaint_id uuid,
  p_confirm boolean,
  p_feedback text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_old_status public.complaint_status;
  v_new_status public.complaint_status;
begin
  if v_user_id is null then
    raise exception 'Sign in is required' using errcode = '42501';
  end if;

  select c.status into v_old_status
  from public.complaints c
  where c.id = p_complaint_id and c.user_id = v_user_id
  for update;

  if not found then
    raise exception 'Report not found or access denied' using errcode = '42501';
  end if;

  if v_old_status not in ('awaiting_confirmation', 'resolved') then
    raise exception 'This report is not awaiting resolution confirmation';
  end if;

  v_new_status := case when p_confirm then 'resolved'::public.complaint_status
                       else 'reopened'::public.complaint_status end;

  update public.complaints
  set status = v_new_status,
      student_feedback = nullif(left(btrim(coalesce(p_feedback, '')), 1000), ''),
      updated_at = now()
  where id = p_complaint_id;

  insert into public.complaint_status_history
    (complaint_id, changed_by, old_status, new_status, note)
  values (
    p_complaint_id, v_user_id, v_old_status, v_new_status,
    case when p_confirm then 'Student confirmed the issue is fixed.'
         else coalesce(nullif(left(btrim(coalesce(p_feedback, '')), 1000), ''),
                       'Student reported that the issue is not fixed.') end
  );

  insert into public.notifications(user_id, complaint_id, message)
  select c.user_id, c.id,
         case when p_confirm then 'Your report was confirmed as resolved.'
              else 'Your report was reopened after your feedback.' end
  from public.complaints c where c.id = p_complaint_id
    and c.user_id <> v_user_id;
end;
$$;

revoke all on function public.student_confirm_resolution(uuid, boolean, text) from public, anon;
grant execute on function public.student_confirm_resolution(uuid, boolean, text) to authenticated;

-- A public avatar bucket is safe because profile photos are intentionally visible.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-avatars', 'profile-avatars', true, 3145728,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can upload their own profile avatar" on storage.objects;
create policy "Users can upload their own profile avatar"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
drop policy if exists "Anyone can view profile avatars" on storage.objects;
create policy "Anyone can view profile avatars"
  on storage.objects for select to public
  using (bucket_id = 'profile-avatars');
drop policy if exists "Users can update their own profile avatar" on storage.objects;
create policy "Users can update their own profile avatar"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
drop policy if exists "Users can delete their own profile avatar" on storage.objects;
create policy "Users can delete their own profile avatar"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
