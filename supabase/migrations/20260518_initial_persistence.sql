create table if not exists public.reports (
  id text primary key,
  "createdAt" text not null,
  status text not null check (status in ('missing', 'found', 'closed')),
  "reporterName" text not null,
  "reporterEmail" text not null,
  "reporterPhone" text,
  "lastKnownLocation" jsonb not null default '{"lat":0,"lng":0}'::jsonb,
  "lastKnownLocationName" text,
  "lastSeenAt" text not null,
  person jsonb not null,
  photos jsonb not null default '[]'::jsonb,
  "voiceTranscript" text,
  exif jsonb
);

create table if not exists public.sightings (
  id text primary key,
  "createdAt" text not null,
  anonymous boolean not null default true,
  notes text not null,
  location jsonb not null default '{"lat":0,"lng":0}'::jsonb,
  "seenAt" text not null,
  photos jsonb not null default '[]'::jsonb,
  country text
);

create table if not exists public.found (
  id text primary key,
  "createdAt" text not null,
  "registrarOrg" text not null,
  "registrarContact" text not null,
  notes text not null,
  location jsonb not null default '{"lat":0,"lng":0}'::jsonb,
  "estimatedAge" integer,
  photos jsonb not null default '[]'::jsonb
);

create table if not exists public.stories (
  id text primary key,
  "createdAt" text not null,
  "authorName" text not null,
  story text not null,
  tags jsonb not null default '[]'::jsonb,
  "locationHint" text
);

notify pgrst, 'reload schema';
