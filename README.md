# Afitfix

A mobile-first campus issue reporting and resolution platform.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase Auth, Postgres and Storage
- Lucide icons

## Local development

1. Install Node.js 20.9 or newer.
2. Clone this repository.
3. Install dependencies with `npm install`.
4. Copy `.env.example` to `.env.local` and add your Supabase project URL and anon/publishable key.
5. Run `npm run dev` and open http://localhost:3000.

## Supabase setup

1. Create a Supabase project.
2. Open SQL Editor and run `supabase/schema.sql`.
3. Create a Storage bucket named `complaint-images` (private by default; storage policies will be added with the upload feature).
4. Add the project URL and anon/publishable key to your environment variables.
5. Sign up your admin account, then promote it using the commented SQL statement at the bottom of `supabase/schema.sql`.

Never put a Supabase service-role key in a browser environment variable or commit it to GitHub.

## MVP roles

- **Student:** submit reports, browse the community feed, comment, vote, track status and confirm/dispute a proposed resolution.
- **Admin:** review reports, update status, add progress/resolution notes and manage reports.

## Mobile design

The interface is designed mobile-first for Android Chrome and iPhone Safari, with safe-area spacing, touch-sized controls and responsive layouts.
