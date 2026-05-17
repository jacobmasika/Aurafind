import {
  DiscoverStory,
  FoundRegisterEntry,
  MissingReport,
  SightingReport,
} from "@/types/domain";

interface DataStore {
  reports: MissingReport[];
  sightings: SightingReport[];
  found: FoundRegisterEntry[];
  stories: DiscoverStory[];
}

const store: DataStore = {
  reports: [],
  sightings: [],
  found: [],
  stories: [],
};

export function getStore() {
  return store;
}
