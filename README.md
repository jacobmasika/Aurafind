# AuraFind

AuraFind is a serverless-ready global missing persons and reunion web app built with Next.js App Router. It includes high-empathy intake workflows, anonymous sightings, found-person registration, probabilistic AI-style matching, emergency broadcast tooling, and a premium mobile-first UI.

## Highlights Implemented

- Frictionless multi-step incident reporting wizard with local draft autosave
- Anonymous sighting submission with geolocation and photo support
- One-click emergency broadcast endpoint and printable missing-person PDF poster generation
- EXIF metadata extraction from uploaded images (client-side)
- Voice-to-text report capture (browser speech recognition)
- Found register for shelters/hospitals/good samaritans
- Discover network for kinship stories with NLP-style tag extraction and overlap linking
- AI-style probabilistic match scoring combining face seed similarity, geo distance, and time windows
- Geofenced push-notification opt-in groundwork with service worker registration
- Dark mode and low-bandwidth mode

## Tech Stack

- Frontend and API: Next.js 16 App Router
- Styling: Tailwind CSS v4 + custom design system
- Motion: Framer Motion
- Validation: Zod
- PDF: jsPDF
- EXIF extraction: exifr

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Open http://localhost:3000

## Environment Variables

Copy `.env.example` to `.env.local` and configure as needed.

Communication and AWS variables are optional in this version and used to signal integration readiness.

For persistent production storage, these are required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_KEY` or `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (client-side)

## API Routes

- `GET/POST /api/reports`
- `GET/POST /api/sightings`
- `GET/POST /api/found`
- `GET/POST /api/discover`
- `POST /api/matches`
- `POST /api/broadcast`
- `GET /api/health`

## Important Note on Persistence

Production persistence now uses Supabase-backed storage. Apply the SQL migration in `supabase/migrations/20260518_initial_persistence.sql` so the `reports`, `sightings`, `found`, and `stories` tables exist in `public` before deploying.

Also apply `supabase/migrations/20260527_reliability_indexes.sql` for index and default-value hardening.

Local development can still use the file store when `USE_FILE_STORE=true`.

## Supabase Setup (Dashboard)

1. Create a new Supabase project.
2. Open SQL Editor and run the full SQL in:
	- `supabase/migrations/20260518_initial_persistence.sql`
	- `supabase/migrations/20260527_reliability_indexes.sql`
3. In Supabase, go to Project Settings > API and copy:
	- Project URL
	- service_role key

## Vercel Link + Env Setup

1. Import this repository into Vercel.
2. In Vercel Project Settings > Environment Variables, add:
	- `NEXT_PUBLIC_SUPABASE_URL` = your Supabase Project URL
	- `SUPABASE_SERVICE_KEY` = your Supabase service_role key
	- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key, or reuse the publishable key name if that is what you already use
3. Add both variables to Production, Preview, and Development environments.
4. Redeploy the project.

## Verify Persistence

1. Open `/api/health` after deployment.
2. Confirm response includes `"persistence": "supabase"`.
3. Submit one report and confirm a new row appears in Supabase table `public.reports`.

## Deploy

Deploy on Vercel for edge hosting:

```bash
npm run build
```

Then import this folder into Vercel and configure environment variables.
