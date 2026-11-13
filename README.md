# Afitfix

A mobile-first campus issue reporting and resolution platform for students and campus administrators.

## Stack

- Next.js 15 App Router + TypeScript
- Tailwind CSS v4 and Lucide icons
- Supabase Auth, Postgres, Row Level Security and Storage
- Responsive layouts for Android Chrome and iPhone Safari

## Supabase setup

1. Open the Supabase project SQL Editor.
2. Run `supabase/schema.sql`.
3. Run `supabase/privacy-fix.sql` to restrict access to private student profile fields.
4. Run `supabase/storage.sql` to create the report-image bucket and its access policies.
5. In Supabase Authentication settings, configure the allowed site URL and email redirect URLs for your deployed app.
6. Add the public project URL and publishable key to your deployment environment variables.

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase publishable key)

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
- `/admin` Admin-only report review and status management

## First admin account

Register your own account normally. Then, in the Supabase SQL Editor, promote that account using the project-owner SQL editor:

```sql
update public.profiles
set role = 'admin'
where email = 'your-admin-email@example.com';
```

Do not expose admin promotion as a public application feature.

## Current limitations

- Email/password authentication is implemented; email confirmation behavior follows your Supabase Auth settings.
- Image uploads use a public bucket because reports are visible in the campus community. Do not upload private documents or sensitive personal information.
- Notifications, comments, voting and student resolution confirmation are represented in the database foundation and are planned for the next feature pass; the current UI does not yet expose all of them.
- Apply all SQL files in the order above before testing the live data features.
