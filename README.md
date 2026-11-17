# Afitfix

A mobile-first campus issue reporting and resolution platform for students and campus administrators.

## Stack

- Next.js 15 App Router + TypeScript
- Tailwind CSS v4 and Lucide icons
- Supabase Auth, Postgres, Row Level Security and Storage
- Responsive layouts for Android Chrome and iPhone Safari

## Supabase setup

The database is split into three SQL files. Run them in this order in the Supabase SQL Editor:

1. `supabase/schema.sql` creates the app tables, profile-on-signup trigger, role helper, indexes and Row Level Security policies.
2. `supabase/storage.sql` creates the public report-image bucket and owner-only upload/delete policies.
3. `supabase/notifications.sql` creates in-app notifications when a report status changes or someone comments on a report.

The schema keeps email addresses and matric numbers private. Signed-in students can see campus reports, comments, votes and status history, but can only read their own profile. Admin access is based on the protected `profiles.role` column, not editable signup metadata.

## Authentication and protected routes

- Email/password signup and sign-in are available at `/login`.
- The middleware refreshes and validates the Supabase session.
- `/dashboard`, `/report/*` and `/notifications` require a signed-in user.
- `/admin` requires a signed-in user whose database profile role is `admin`.
- Database Row Level Security remains the final permission boundary, even if someone bypasses a page redirect.

In Supabase Dashboard > Authentication > URL Configuration, set the Site URL to your deployed app origin and add these Redirect URLs:

- `http://localhost:3000/**` for local development
- `https://YOUR-DEPLOYED-DOMAIN/**` for the deployed app (replace with your real Vercel domain)

Email confirmation behavior follows the Supabase Auth settings for the project.

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the Supabase publishable key)

Add the same two values to the Vercel project's environment variables for Preview and Production, then redeploy.

Never expose a Supabase secret/service-role key in the browser or commit it to GitHub. If a secret key has ever been shared publicly or in chat, rotate it in Supabase.

## Run locally

1. Use Node.js 20.9 or newer.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open `http://localhost:3000`.

## MVP routes

- `/` Public introduction
- `/login` Student registration and sign-in
- `/dashboard` Authenticated campus feed and personal report summary
- `/report/new` Submit a campus report with an optional image
- `/report/[id]` View progress, add comments and support a report
- `/notifications` Read report updates
- `/admin` Admin-only report review and status management

## First admin account

1. Register your own account normally.
2. Confirm the email if confirmation is enabled.
3. In Supabase SQL Editor, promote the account using the project-owner SQL editor:

```sql
update public.profiles
set role = 'admin'
where email = 'your-admin-email@example.com';
```

Do not expose admin promotion as a public application feature.

## Current limitations

- Student confirmation or dispute of a proposed resolution is planned for a later feature pass.
- Report images are stored in a public bucket because reports are visible in the campus community. Do not upload private documents or sensitive personal information.
