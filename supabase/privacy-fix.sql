-- Run after schema.sql. Safe to run repeatedly.
-- Students can read only their own profile; admins can read all profiles.
drop policy if exists "Authenticated users can read profiles" on public.profiles;
drop policy if exists "Users can read their own profile and admins can read all" on public.profiles;

create policy "Users can read their own profile and admins can read all"
on public.profiles for select to authenticated
using (id = (select auth.uid()) or public.is_admin());

revoke select on public.profiles from authenticated;
grant select (id, full_name, role) on public.profiles to authenticated;
