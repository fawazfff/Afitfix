-- Follow-up fixes for the Afitfix product expansion.
grant select (created_at) on public.profiles to authenticated;

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
  values (
    v_user_id, p_complaint_id,
    case when p_confirm then 'You confirmed that this report is resolved.'
         else 'Your report has been reopened after your feedback.' end
  );
end;
$$;
revoke all on function public.student_confirm_resolution(uuid, boolean, text) from public, anon;
grant execute on function public.student_confirm_resolution(uuid, boolean, text) to authenticated;
