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

// Only enable file-backed storage in development or when explicitly requested.
const FILE_STORE_ENABLED = process.env.NODE_ENV === "development" || process.env.USE_FILE_STORE === "true";

// Supabase client setup
const SUPABASE_ENABLED = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);

let supabaseClient: ReturnType<typeof createClient> | null = null;

if (SUPABASE_ENABLED) {
  supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

interface DataStore {
  reports: MissingReport[];
  sightings: SightingReport[];
  found: FoundRegisterEntry[];
  stories: DiscoverStory[];
}

let store: DataStore = {
  reports: [],
  sightings: [],
  found: [],
  stories: [],
};

function loadStoreFromFile() {
  if (!FILE_STORE_ENABLED) return;
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, "utf8");
      const parsed = raw ? JSON.parse(raw) : {};
      store = {
        reports: parsed.reports || [],
        sightings: parsed.sightings || [],
        found: parsed.found || [],
        stories: parsed.stories || [],
      };
    } else {
      const dir = path.dirname(STORE_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      saveStoreToFile();
    }
  } catch (err) {
    console.error("Failed to load store.json:", err);
  }
}

async function loadStoreFromSupabase() {
  if (!supabaseClient) return;
  try {
    const [reportsRes, sightingsRes, foundRes, storiesRes] = await Promise.all([
      supabaseClient.from("reports").select("*"),
      supabaseClient.from("sightings").select("*"),
      supabaseClient.from("found").select("*"),
      supabaseClient.from("stories").select("*"),
    ]);

    store = {
      reports: (reportsRes.data || []) as MissingReport[],
      sightings: (sightingsRes.data || []) as SightingReport[],
      found: (foundRes.data || []) as FoundRegisterEntry[],
      stories: (storiesRes.data || []) as DiscoverStory[],
    };
  } catch (err) {
    console.error("Failed to load from Supabase:", err);
  }
}

export function getStore(): DataStore {
  return store;
}

export function saveStoreToFile() {
  if (!FILE_STORE_ENABLED) return;
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to write store.json:", err);
  }
}

export async function saveStoreToSupabase() {
  if (!supabaseClient) return;
  try {
    // Insert or replace reports
    if (store.reports.length > 0) {
      await supabaseClient.from("reports").upsert(store.reports as never[]);
    } else {
      await supabaseClient.from("reports").delete().neq("id", "");
    }

    // Insert or replace sightings
    if (store.sightings.length > 0) {
      await supabaseClient.from("sightings").upsert(store.sightings as never[]);
    } else {
      await supabaseClient.from("sightings").delete().neq("id", "");
    }

    // Insert or replace found
    if (store.found.length > 0) {
      await supabaseClient.from("found").upsert(store.found as never[]);
    } else {
      await supabaseClient.from("found").delete().neq("id", "");
    }

    // Insert or replace stories
    if (store.stories.length > 0) {
      await supabaseClient.from("stories").upsert(store.stories as never[]);
    } else {
      await supabaseClient.from("stories").delete().neq("id", "");
    }
  } catch (err) {
    console.error("Failed to save to Supabase:", err);
  }
}

export async function saveStore() {
  if (SUPABASE_ENABLED) {
    await saveStoreToSupabase();
  } else {
    saveStoreToFile();
  }
}

// Load at startup
async function initStore() {
  if (SUPABASE_ENABLED) {
    await loadStoreFromSupabase();
  } else {
    loadStoreFromFile();
  }
}

// Load immediately for sync calls, but also set up async load
initStore().catch((err) => {
  console.error("Store initialization failed:", err);
});
