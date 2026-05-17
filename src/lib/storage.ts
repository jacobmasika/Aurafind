import fs from "fs";
import path from "path";
import {
  DiscoverStory,
  FoundRegisterEntry,
  MissingReport,
  SightingReport,
} from "@/types/domain";

const STORE_PATH = path.resolve(process.cwd(), "data", "store.json");

// Only enable file-backed storage in development or when explicitly requested.
const FILE_STORE_ENABLED = process.env.NODE_ENV === "development" || process.env.USE_FILE_STORE === "true";

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

function loadStore() {
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
      // ensure directory exists
      const dir = path.dirname(STORE_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      saveStore();
    }
  } catch (err) {
    // don't crash the app if load fails
    // eslint-disable-next-line no-console
    console.error("Failed to load store.json:", err);
  }
}

export function getStore(): DataStore {
  return store;
}

export function saveStore() {
  if (!FILE_STORE_ENABLED) return;
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to write store.json:", err);
  }
}

// load at startup
loadStore();
