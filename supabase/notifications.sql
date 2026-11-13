-- Run after schema.sql. Creates in-app alerts for report owners.
create or replace function public.notify_report_owner_on_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status is distinct from new.status then
    insert into public.notifications (user_id, complaint_id, message)
    values (
      new.user_id,
      new.id,
      'Your report ' || new.tracking_code || ' is now ' || replace(new.status::text, '_', ' ') || '.'
    );
  end if;
  return new;
end;
$$;

create trigger complaints_notify_owner
after update of status on public.complaints
for each row execute procedure public.notify_report_owner_on_status_change();

create or replace function public.notify_report_owner_on_comment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid;
  tracking text;
begin
  select user_id, tracking_code into owner_id, tracking
  from public.complaints where id = new.complaint_id;

  if owner_id is not null and owner_id <> new.user_id then
    insert into public.notifications (user_id, complaint_id, message)
    values (owner_id, new.complaint_id, 'Someone commented on your report ' || tracking || '.');
  end if;
  return new;
end;
$$;

create trigger comments_notify_report_owner
after insert on public.complaint_comments
for each row execute procedure public.notify_report_owner_on_comment();
