-- Reliability hardening for production workloads.
-- Keeps API-compatible camelCase columns while adding sane DB defaults and indexes.

alter table if exists public.reports
  alter column "createdAt" set default timezone('utc', now())::text,
  alter column "lastSeenAt" set default timezone('utc', now())::text,
  alter column "photos" set default '[]'::jsonb,
  alter column "lastKnownLocation" set default '{"lat":0,"lng":0}'::jsonb;

alter table if exists public.sightings
  alter column "createdAt" set default timezone('utc', now())::text,
  alter column "seenAt" set default timezone('utc', now())::text,
  alter column "photos" set default '[]'::jsonb,
  alter column "location" set default '{"lat":0,"lng":0}'::jsonb;

alter table if exists public.found
  alter column "createdAt" set default timezone('utc', now())::text,
  alter column "photos" set default '[]'::jsonb,
  alter column "location" set default '{"lat":0,"lng":0}'::jsonb;

alter table if exists public.stories
  alter column "createdAt" set default timezone('utc', now())::text,
  alter column "tags" set default '[]'::jsonb;

create index if not exists idx_reports_created_at on public.reports ("createdAt" desc);
create index if not exists idx_reports_status on public.reports (status);

create index if not exists idx_sightings_created_at on public.sightings ("createdAt" desc);
create index if not exists idx_found_created_at on public.found ("createdAt" desc);
create index if not exists idx_stories_created_at on public.stories ("createdAt" desc);

notify pgrst, 'reload schema';