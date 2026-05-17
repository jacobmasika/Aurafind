const STOP_WORDS = new Set([
  "the",
  "and",
  "a",
  "an",
  "in",
  "on",
  "at",
  "to",
  "for",
  "with",
  "of",
  "from",
  "my",
  "our",
  "their",
  "was",
  "were",
  "is",
  "are",
]);

export function extractStoryTags(story: string) {
  return Array.from(
    new Set(
      story
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/)
        .filter((token) => token.length > 3 && !STOP_WORDS.has(token)),
    ),
  ).slice(0, 12);
}

export function overlapScore(left: string[], right: string[]) {
  const set = new Set(left);
  let hits = 0;

  for (const token of right) {
    if (set.has(token)) {
      hits += 1;
    }
  }

  return hits;
}
