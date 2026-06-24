-- AuraFind Supabase schema setup
-- Run this entire file in the Supabase SQL Editor.

create table if not exists public.reports (
  id text primary key,
  "createdAt" text not null default timezone('utc', now())::text,
  status text not null check (status in ('missing', 'found', 'closed')),
  "reporterName" text not null,
  "reporterEmail" text not null,
  "reporterPhone" text,
  "lastKnownLocation" jsonb not null default '{"lat":0,"lng":0}'::jsonb,
  "lastKnownLocationName" text,
  "lastSeenAt" text not null default timezone('utc', now())::text,
  person jsonb not null,
  photos jsonb not null default '[]'::jsonb,
  "voiceTranscript" text,
  exif jsonb
);

create table if not exists public.sightings (
  id text primary key,
  "createdAt" text not null default timezone('utc', now())::text,
  anonymous boolean not null default true,
  notes text not null,
  location jsonb not null default '{"lat":0,"lng":0}'::jsonb,
  "seenAt" text not null default timezone('utc', now())::text,
  photos jsonb not null default '[]'::jsonb,
  country text
);

create table if not exists public.found (
  id text primary key,
  "createdAt" text not null default timezone('utc', now())::text,
  "registrarOrg" text not null,
  "registrarContact" text not null,
  notes text not null,
  location jsonb not null default '{"lat":0,"lng":0}'::jsonb,
  "estimatedAge" integer,
  photos jsonb not null default '[]'::jsonb
);

create table if not exists public.stories (
  id text primary key,
  "createdAt" text not null default timezone('utc', now())::text,
  "authorName" text not null,
  story text not null,
  tags jsonb not null default '[]'::jsonb,
  "locationHint" text
);

alter table if exists public.reports
  add column if not exists "createdAt" text not null default timezone('utc', now())::text,
  add column if not exists status text not null default 'missing',
  add column if not exists "reporterName" text not null default '',
  add column if not exists "reporterEmail" text not null default '',
  add column if not exists "reporterPhone" text,
  add column if not exists "lastKnownLocation" jsonb not null default '{"lat":0,"lng":0}'::jsonb,
  add column if not exists "lastKnownLocationName" text,
  add column if not exists "lastSeenAt" text not null default timezone('utc', now())::text,
  add column if not exists person jsonb not null default '{}'::jsonb,
  add column if not exists photos jsonb not null default '[]'::jsonb,
  add column if not exists "voiceTranscript" text,
  add column if not exists exif jsonb;

alter table if exists public.sightings
  add column if not exists "createdAt" text not null default timezone('utc', now())::text,
  add column if not exists anonymous boolean not null default true,
  add column if not exists notes text not null default '',
  add column if not exists location jsonb not null default '{"lat":0,"lng":0}'::jsonb,
  add column if not exists "seenAt" text not null default timezone('utc', now())::text,
  add column if not exists photos jsonb not null default '[]'::jsonb,
  add column if not exists country text;

alter table if exists public.found
  add column if not exists "createdAt" text not null default timezone('utc', now())::text,
  add column if not exists "registrarOrg" text not null default '',
  add column if not exists "registrarContact" text not null default '',
  add column if not exists notes text not null default '',
  add column if not exists location jsonb not null default '{"lat":0,"lng":0}'::jsonb,
  add column if not exists "estimatedAge" integer,
  add column if not exists photos jsonb not null default '[]'::jsonb;

alter table if exists public.stories
  add column if not exists "createdAt" text not null default timezone('utc', now())::text,
  add column if not exists "authorName" text not null default '',
  add column if not exists story text not null default '',
  add column if not exists tags jsonb not null default '[]'::jsonb,
  add column if not exists "locationHint" text;

create index if not exists idx_reports_created_at on public.reports ("createdAt" desc);
create index if not exists idx_reports_status on public.reports (status);
create index if not exists idx_sightings_created_at on public.sightings ("createdAt" desc);
create index if not exists idx_found_created_at on public.found ("createdAt" desc);
create index if not exists idx_stories_created_at on public.stories ("createdAt" desc);

alter table public.reports enable row level security;
alter table public.sightings enable row level security;
alter table public.found enable row level security;
alter table public.stories enable row level security;

drop policy if exists reports_public_read on public.reports;
drop policy if exists reports_public_write on public.reports;
create policy reports_public_read on public.reports for select to anon, authenticated using (true);
create policy reports_public_write on public.reports for insert to anon, authenticated with check (true);

drop policy if exists sightings_public_read on public.sightings;
drop policy if exists sightings_public_write on public.sightings;
create policy sightings_public_read on public.sightings for select to anon, authenticated using (true);
create policy sightings_public_write on public.sightings for insert to anon, authenticated with check (true);

drop policy if exists found_public_read on public.found;
drop policy if exists found_public_write on public.found;
create policy found_public_read on public.found for select to anon, authenticated using (true);
create policy found_public_write on public.found for insert to anon, authenticated with check (true);

drop policy if exists stories_public_read on public.stories;
drop policy if exists stories_public_write on public.stories;
create policy stories_public_read on public.stories for select to anon, authenticated using (true);
create policy stories_public_write on public.stories for insert to anon, authenticated with check (true);

notify pgrst, 'reload schema';
