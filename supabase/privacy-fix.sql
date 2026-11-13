-- Run this after schema.sql to keep private student contact details private.
drop policy if exists "Authenticated users can read profiles" on public.profiles;
create policy "Users can read their own profile and admins can read all"
on public.profiles for select to authenticated
using (id = (select auth.uid()) or public.is_admin());

revoke select on public.profiles from authenticated;
grant select (id, full_name, role) on public.profiles to authenticated;
grant select (id, full_name, role, email, matric_number, created_at)
on public.profiles to authenticated;