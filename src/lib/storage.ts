import { createClient } from "@supabase/supabase-js";
import {
  DiscoverStory,
  FoundRegisterEntry,
  MissingReport,
  SightingReport,
} from "@/types/domain";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_ENABLED = Boolean(SUPABASE_URL && SUPABASE_KEY);

const supabaseClient = SUPABASE_ENABLED
  ? createClient(SUPABASE_URL!, SUPABASE_KEY!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

function getSupabaseClient() {
  if (!SUPABASE_ENABLED || !supabaseClient) {
    throw new Error("Supabase is required. Configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY for limited mode).");
  }

  return supabaseClient;
}

export function getPersistenceMode(): "supabase" | "file" {
  return SUPABASE_ENABLED ? "supabase" : "file";
}

export async function listReports(): Promise<MissingReport[]> {
  const client = getSupabaseClient();
  const { data, error } = await client.from("reports").select("*").order("createdAt", { ascending: false });
  if (error) throw error;
  return (data || []) as MissingReport[];
}

export async function createReport(report: MissingReport): Promise<MissingReport> {
  const client = getSupabaseClient();
  const { data, error } = await client.from("reports").insert(report as never).select("*").single();
  if (error) throw error;
  return data as MissingReport;
}

export async function getReportById(reportId: string): Promise<MissingReport | null> {
  const client = getSupabaseClient();
  const { data, error } = await client.from("reports").select("*").eq("id", reportId).maybeSingle();
  if (error) throw error;
  return (data as MissingReport | null) ?? null;
}

export async function listSightings(): Promise<SightingReport[]> {
  const client = getSupabaseClient();
  const { data, error } = await client.from("sightings").select("*").order("createdAt", { ascending: false });
  if (error) throw error;
  return (data || []) as SightingReport[];
}

export async function createSighting(sighting: SightingReport): Promise<SightingReport> {
  const client = getSupabaseClient();
  const { data, error } = await client.from("sightings").insert(sighting as never).select("*").single();
  if (error) throw error;
  return data as SightingReport;
}

export async function listFound(): Promise<FoundRegisterEntry[]> {
  const client = getSupabaseClient();
  const { data, error } = await client.from("found").select("*").order("createdAt", { ascending: false });
  if (error) throw error;
  return (data || []) as FoundRegisterEntry[];
}

export async function createFound(entry: FoundRegisterEntry): Promise<FoundRegisterEntry> {
  const client = getSupabaseClient();
  const { data, error } = await client.from("found").insert(entry as never).select("*").single();
  if (error) throw error;
  return data as FoundRegisterEntry;
}

export async function listStories(): Promise<DiscoverStory[]> {
  const client = getSupabaseClient();
  const { data, error } = await client.from("stories").select("*").order("createdAt", { ascending: false });
  if (error) throw error;
  return (data || []) as DiscoverStory[];
}

export async function createStory(story: DiscoverStory): Promise<DiscoverStory> {
  const client = getSupabaseClient();
  const { data, error } = await client.from("stories").insert(story as never).select("*").single();
  if (error) throw error;
  return data as DiscoverStory;
}
