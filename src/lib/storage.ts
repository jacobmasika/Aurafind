import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import {
  DiscoverStory,
  FoundRegisterEntry,
  MissingReport,
  SightingReport,
} from "@/types/domain";

function resolveSupabaseKey() {
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error(
      "Missing SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) in server environment."
    );
  }

  return key;
}
const STORE_PATH =
  process.env.NODE_ENV === "development"
    ? path.resolve(process.cwd(), "data", "store.json")
    : path.join("/tmp", "aurafind-store.json");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hxtmqgkirxrqtoewvyor.supabase.co";
const SUPABASE_KEY = resolveSupabaseKey();
console.log("=== SUPABASE CONFIG ===");
console.log("URL:", SUPABASE_URL);
console.log("Using Service Role:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log("Using Service Key:", !!process.env.SUPABASE_SERVICE_KEY);
console.log("Using Publishable:", !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
console.log("Using Anon:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
console.log("Resolved key starts with:", SUPABASE_KEY?.substring(0, 20));
console.log("SERVICE_ROLE_KEY exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log("SERVICE_KEY exists:", !!process.env.SUPABASE_SERVICE_KEY);
//console.log("Resolved key prefix:", SUPABASE_KEY.substring(0, 20));
const SUPABASE_ENABLED = Boolean(SUPABASE_URL && SUPABASE_KEY);
const ALLOW_FILE_STORE = process.env.USE_FILE_STORE === "true";
const FILE_STORE_ENABLED = ALLOW_FILE_STORE || (!SUPABASE_ENABLED && process.env.NODE_ENV === "development");

const supabaseClient = SUPABASE_ENABLED
  ? createClient(SUPABASE_URL!, SUPABASE_KEY!, {
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

function sortByCreatedAtDesc<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

function ensureStoreDirectory() {
  const directory = path.dirname(STORE_PATH);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

async function readFileStore(): Promise<DataStore> {
  if (!FILE_STORE_ENABLED) {
    throw new Error("File storage is disabled. Configure Supabase for production persistence.");
  }

  try {
    if (!fs.existsSync(STORE_PATH)) {
      ensureStoreDirectory();
      const initialStore = emptyStore();
      fs.writeFileSync(STORE_PATH, JSON.stringify(initialStore, null, 2), "utf8");
      return initialStore;
    }

    const raw = fs.readFileSync(STORE_PATH, "utf8");
    const parsed = raw ? (JSON.parse(raw) as Partial<DataStore>) : {};

    return {
      reports: parsed.reports || [],
      sightings: parsed.sightings || [],
      found: parsed.found || [],
      stories: parsed.stories || [],
    };
  } catch (error) {
    console.error("Failed to read file store:", error);
    return emptyStore();
  }
}

async function writeFileStore(store: DataStore) {
  if (!FILE_STORE_ENABLED) {
    throw new Error("File storage is disabled. Configure Supabase for production persistence.");
  }

  try {
    ensureStoreDirectory();
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
  } catch (error) {
    console.error("Failed to write file store:", error);
    throw error;
  }
}

function getSupabaseClient() {
  if (!SUPABASE_ENABLED || !supabaseClient) {
    throw new Error(
      "Supabase is required. Configure NEXT_PUBLIC_SUPABASE_URL and either SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY for server access, plus NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY for the client.",
    );
  }

  return supabaseClient;
}

export function getPersistenceMode(): "supabase" | "file" {
  return FILE_STORE_ENABLED ? "file" : "supabase";
}

export function hasSupabaseConfiguration() {
  return SUPABASE_ENABLED;
}

export async function listReports(): Promise<MissingReport[]> {
  if (SUPABASE_ENABLED && supabaseClient) {
    const client = getSupabaseClient();
    const { data, error } = await client.from("reports").select("*").order("createdAt", { ascending: false });
    if (error) throw error;
    return (data || []) as MissingReport[];
  }

  const store = await readFileStore();
  return sortByCreatedAtDesc(store.reports);
}

export async function createReport(report: MissingReport): Promise<MissingReport> {
  if (SUPABASE_ENABLED && supabaseClient) {
    const client = getSupabaseClient();
    const { data, error } = await client.from("reports").insert(report as never).select("*").single();
    if (error) {
  console.error("Supabase insert failed:");
  console.error(JSON.stringify(error, null, 2));
  console.error("Report payload:");
  console.error(JSON.stringify(report, null, 2));
  throw error;
}
    return data as MissingReport;
  }

  const store = await readFileStore();
  store.reports.unshift(report);
  await writeFileStore(store);
  return report;
}

export async function getReportById(reportId: string): Promise<MissingReport | null> {
  if (SUPABASE_ENABLED && supabaseClient) {
    const client = getSupabaseClient();
    const { data, error } = await client.from("reports").select("*").eq("id", reportId).maybeSingle();
    if (error) throw error;
    return (data as MissingReport | null) ?? null;
  }

  const store = await readFileStore();
  return store.reports.find((item) => item.id === reportId) || null;
}

export async function deleteReport(reportId: string): Promise<void> {
  if (SUPABASE_ENABLED && supabaseClient) {
    const client = getSupabaseClient();
    const { error } = await client.from("reports").delete().eq("id", reportId);
    if (error) throw error;
    return;
  }

  const store = await readFileStore();
  store.reports = store.reports.filter((item) => item.id !== reportId);
  await writeFileStore(store);
}

export async function listSightings(): Promise<SightingReport[]> {
  if (SUPABASE_ENABLED && supabaseClient) {
    const client = getSupabaseClient();
    const { data, error } = await client.from("sightings").select("*").order("createdAt", { ascending: false });
    if (error) throw error;
    return (data || []) as SightingReport[];
  }

  const store = await readFileStore();
  return sortByCreatedAtDesc(store.sightings);
}

export async function createSighting(sighting: SightingReport): Promise<SightingReport> {
  if (SUPABASE_ENABLED && supabaseClient) {
    const client = getSupabaseClient();
    const { data, error } = await client.from("sightings").insert(sighting as never).select("*").single();
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
    const client = getSupabaseClient();
    const { data, error } = await client.from("found").select("*").order("createdAt", { ascending: false });
    if (error) throw error;
    return (data || []) as FoundRegisterEntry[];
  }

  const store = await readFileStore();
  return sortByCreatedAtDesc(store.found);
}

export async function createFound(entry: FoundRegisterEntry): Promise<FoundRegisterEntry> {
  if (SUPABASE_ENABLED && supabaseClient) {
    const client = getSupabaseClient();
    const { data, error } = await client.from("found").insert(entry as never).select("*").single();
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
    const client = getSupabaseClient();
    const { data, error } = await client.from("stories").select("*").order("createdAt", { ascending: false });
    if (error) throw error;
    return (data || []) as DiscoverStory[];
  }

  const store = await readFileStore();
  return sortByCreatedAtDesc(store.stories);
}

export async function createStory(story: DiscoverStory): Promise<DiscoverStory> {
  if (SUPABASE_ENABLED && supabaseClient) {
    const { data, error } = await supabaseClient.from("stories").insert(story as never).select("*").single();
    if (error) throw error;
    return data as DiscoverStory;
  }

  const store = await readFileStore();
  store.stories.unshift(story);
  await writeFileStore(store);
  return story;
}
