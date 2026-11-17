# Afitfix

A mobile-first campus issue reporting and resolution platform for students and campus administrators.

## Stack

- Next.js 15 App Router + TypeScript
- Tailwind CSS v4 and Lucide icons
- Supabase Auth, Postgres, Row Level Security and Storage
- Responsive layouts for Android Chrome and iPhone Safari

## Supabase setup

Run these files in **Supabase Dashboard → SQL Editor**, in this exact order. Each script is designed to be safe to run again.

1. `supabase/schema.sql` creates the core tables, access policies, helper functions and the atomic admin status-update function.
2. `supabase/privacy-fix.sql` restricts access to private student profile fields.
3. `supabase/storage.sql` creates the report-image bucket and its access policies.
4. `supabase/notifications.sql` creates the notification triggers for report status changes and comments.

After running the SQL files:

5. In Supabase Authentication settings, configure the allowed site URL and email redirect URLs for your deployed app.
6. Add the public project URL and publishable key to your deployment environment variables.
7. Register an account. To make the first administrator, run the SQL in the [First admin account](#first-admin-account) section as the project owner.

**Important:** Do not run a secret/service-role key in the browser or commit it to GitHub. If a secret key has ever been shared publicly or in chat, rotate it in Supabase.

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase publishable key)

Never expose a Supabase secret/service-role key in a public client or commit it to GitHub.

## Run locally

1. Use Node.js 20.9 or newer.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open `http://localhost:3000`.

## MVP routes

- `/` Public introduction. It does not display invented report examples or statistics.
- `/login` Student registration and sign-in
- `/dashboard` Authenticated campus feed and accurate personal report totals
- `/report/new` Submit a campus report with an optional image
- `/report/[id]` View progress, add comments and support a report
- `/notifications` Read report updates
- `/admin` Admin-only report review and status management

## First admin account

Register your own account normally. Then, in the Supabase SQL Editor, promote that account using the project-owner SQL editor:

```sql
update public.profiles
set role = 'admin'
where email = 'your-admin-email@example.com';
```

Do not expose admin promotion as a public application feature.

## Database behavior

- Admin status changes and their history entries are written by one Postgres function call. If either write fails, the whole operation rolls back.
- Notification triggers run inside the same transaction as the status change or comment that caused them.
- The student dashboard uses exact database counts for the signed-in student's reports. The campus feed remains limited to the latest 30 reports for loading performance.
- The public homepage contains no fabricated campus reports or activity totals.

## Current limitations

- Email/password authentication is implemented; email confirmation behavior follows your Supabase Auth settings.
- Image uploads use a public bucket because reports are visible in the campus community. Do not upload private documents or sensitive personal information.
- Student confirmation or dispute of a proposed resolution is planned for a later feature pass.
