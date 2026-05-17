export type CaseStatus = "missing" | "found" | "closed";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface PersonDetails {
  fullName: string;
  age?: number;
  heightCm?: number;
  eyeColor?: string;
  hairColor?: string;
  distinguishingMarks?: string;
  clothingDescription?: string;
  languages?: string[];
}

export interface MissingReport {
  id: string;
  createdAt: string;
  status: CaseStatus;
  reporterName: string;
  reporterEmail: string;
  reporterPhone?: string;
  lastKnownLocation: Coordinates;
  lastKnownLocationName?: string;
  lastSeenAt: string;
  person: PersonDetails;
  photos: string[];
  voiceTranscript?: string;
  exif?: Record<string, unknown>;
}

export interface SightingReport {
  id: string;
  createdAt: string;
  anonymous: true;
  notes: string;
  location: Coordinates;
  seenAt: string;
  photos: string[];
  country?: string;
}

export interface FoundRegisterEntry {
  id: string;
  createdAt: string;
  registrarOrg: string;
  registrarContact: string;
  notes: string;
  location: Coordinates;
  estimatedAge?: number;
  photos: string[];
}

export interface DiscoverStory {
  id: string;
  createdAt: string;
  authorName: string;
  story: string;
  tags: string[];
  locationHint?: string;
}

export interface MatchResult {
  candidateId: string;
  sourceType: "sighting" | "found";
  score: number;
  components: {
    faceSimilarity: number;
    geoProximityScore: number;
    timeWindowScore: number;
  };
  shouldAlert: boolean;
}
