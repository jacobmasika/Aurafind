import { Coordinates, MatchResult, MissingReport } from "@/types/domain";

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

function haversineKm(a: Coordinates, b: Coordinates) {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const y = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * y;
}

function pseudoFaceSimilarity(seedA: string, seedB: string) {
  const a = seedA.toLowerCase().replace(/\s+/g, "");
  const b = seedB.toLowerCase().replace(/\s+/g, "");
  let overlap = 0;

  for (const ch of new Set(a)) {
    if (b.includes(ch)) {
      overlap += 1;
    }
  }

  return Math.min(99, Math.max(45, Math.round((overlap / Math.max(1, a.length)) * 150)));
}

function timeWindowScore(lastSeenIso: string, candidateIso: string) {
  const diffMs = Math.abs(new Date(lastSeenIso).getTime() - new Date(candidateIso).getTime());
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours <= 12) {
    return 100;
  }
  if (diffHours <= 24) {
    return 85;
  }
  if (diffHours <= 72) {
    return 65;
  }
  if (diffHours <= 168) {
    return 45;
  }
  return 20;
}

export function scoreCandidate(input: {
  report: MissingReport;
  candidateId: string;
  sourceType: "sighting" | "found";
  location: Coordinates;
  seenAt: string;
  similaritySeed: string;
}): MatchResult {
  const faceSimilarity = pseudoFaceSimilarity(input.report.person.fullName, input.similaritySeed);
  const distance = haversineKm(input.report.lastKnownLocation, input.location);
  const geoProximityScore = Math.max(0, Math.round(100 - (distance / 50) * 100));
  const tScore = timeWindowScore(input.report.lastSeenAt, input.seenAt);

  const weighted = Math.round(faceSimilarity * 0.55 + geoProximityScore * 0.25 + tScore * 0.2);

  return {
    candidateId: input.candidateId,
    sourceType: input.sourceType,
    score: weighted,
    components: {
      faceSimilarity,
      geoProximityScore,
      timeWindowScore: tScore,
    },
    shouldAlert: weighted >= 85 && faceSimilarity >= 85 && distance <= 50,
  };
}
