import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import {
  DiscoverStory,
  FoundRegisterEntry,
  MissingReport,
  SightingReport,
} from "@/types/domain";

const STORE_PATH = path.resolve(process.cwd(), "data", "store.json");

// File-backed storage is useful for local development when Supabase is not configured.
const FILE_STORE_ENABLED = process.env.NODE_ENV === "development" || process.env.USE_FILE_STORE === "true";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_ENABLED = Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);

const supabaseClient = SUPABASE_ENABLED
  ? createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

interface DataStore {
  reports: MissingReport[];
  sightings: SightingReport[];
  found: FoundRegisterEntry[];
  stories: DiscoverStory[];
}

function emptyStore(): DataStore {
  return {
    reports: [],
    sightings: [],
    found: [],
    stories: [],
  };
}

function ensureFileStoreEnabled() {
  if (!FILE_STORE_ENABLED) {
    throw new Error("Supabase is not configured and file storage is disabled.");
  }
}

function sortByCreatedAtDesc<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

async function readFileStore(): Promise<DataStore> {
  ensureFileStoreEnabled();

  try {
    if (!fs.existsSync(STORE_PATH)) {
      const dir = path.dirname(STORE_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const initial = emptyStore();
      fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), "utf8");
      return initial;
    }

    const raw = fs.readFileSync(STORE_PATH, "utf8");
    const parsed = raw ? JSON.parse(raw) : {};

    return {
      reports: parsed.reports || [],
      sightings: parsed.sightings || [],
      found: parsed.found || [],
      stories: parsed.stories || [],
    };
  } catch (err) {
    console.error("Failed to read file store:", err);
    return emptyStore();
  }
}

async function writeFileStore(store: DataStore) {
  ensureFileStoreEnabled();

  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to write file store:", err);
    throw err;
  }
}

export function getPersistenceMode(): "supabase" | "file" {
  return SUPABASE_ENABLED ? "supabase" : "file";
}

export async function listReports(): Promise<MissingReport[]> {
  if (SUPABASE_ENABLED && supabaseClient) {
    const { data, error } = await supabaseClient.from("reports").select("*").order("createdAt", { ascending: false });
    if (error) throw error;
    return (data || []) as MissingReport[];
  }

  const store = await readFileStore();
  return sortByCreatedAtDesc(store.reports);
}

export async function createReport(report: MissingReport): Promise<MissingReport> {
  if (SUPABASE_ENABLED && supabaseClient) {
    const { data, error } = await supabaseClient.from("reports").insert(report as never).select("*").single();
    if (error) throw error;
    return data as MissingReport;
  }

  const store = await readFileStore();
  store.reports.unshift(report);
  await writeFileStore(store);
  return report;
}

export async function getReportById(reportId: string): Promise<MissingReport | null> {
  if (SUPABASE_ENABLED && supabaseClient) {
    const { data, error } = await supabaseClient.from("reports").select("*").eq("id", reportId).maybeSingle();
    if (error) throw error;
    return (data as MissingReport | null) ?? null;
  }

  const store = await readFileStore();
  return store.reports.find((item) => item.id === reportId) || null;
}

export async function listSightings(): Promise<SightingReport[]> {
  if (SUPABASE_ENABLED && supabaseClient) {
    const { data, error } = await supabaseClient.from("sightings").select("*").order("createdAt", { ascending: false });
    if (error) throw error;
    return (data || []) as SightingReport[];
  }

  const store = await readFileStore();
  return sortByCreatedAtDesc(store.sightings);
}

export async function createSighting(sighting: SightingReport): Promise<SightingReport> {
  if (SUPABASE_ENABLED && supabaseClient) {
    const { data, error } = await supabaseClient.from("sightings").insert(sighting as never).select("*").single();
    if (error) throw error;
    return data as SightingReport;
  }

  const store = await readFileStore();
  store.sightings.unshift(sighting);
  await writeFileStore(store);
  return sighting;
}

export async function listFound(): Promise<FoundRegisterEntry[]> {
  if (SUPABASE_ENABLED && supabaseClient) {
    const { data, error } = await supabaseClient.from("found").select("*").order("createdAt", { ascending: false });
    if (error) throw error;
    return (data || []) as FoundRegisterEntry[];
  }

  const store = await readFileStore();
  return sortByCreatedAtDesc(store.found);
}

export async function createFound(entry: FoundRegisterEntry): Promise<FoundRegisterEntry> {
  if (SUPABASE_ENABLED && supabaseClient) {
    const { data, error } = await supabaseClient.from("found").insert(entry as never).select("*").single();
    if (error) throw error;
    return data as FoundRegisterEntry;
  }

  const store = await readFileStore();
  store.found.unshift(entry);
  await writeFileStore(store);
  return entry;
}

export async function listStories(): Promise<DiscoverStory[]> {
  if (SUPABASE_ENABLED && supabaseClient) {
    const { data, error } = await supabaseClient.from("stories").select("*").order("createdAt", { ascending: false });
    if (error) throw error;
    return (data || []) as DiscoverStory[];
  }

  const store = await readFileStore();
  return sortByCreatedAtDesc(store.stories);
}

export async function createStory(story: DiscoverStory): Promise<DiscoverStory> {
  if (SUPABASE_ENABLED) {
    const { data, error } = await supabaseClient!.from("stories").insert(story as never).select("*").single();
    if (error) throw error;
    return data as DiscoverStory;
  }

  const store = await readFileStore();
  store.stories.unshift(story);
  await writeFileStore(store);
  return story;
}
