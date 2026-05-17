import { extractStoryTags, overlapScore } from "@/lib/nlp";
import { getStore, saveStore } from "@/lib/storage";
import { DiscoverStory } from "@/types/domain";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

const storySchema = z.object({
  authorName: z.string().min(2),
  story: z.string().min(10),
  locationHint: z.string().optional(),
});

export async function GET() {
  return NextResponse.json({ items: getStore().stories });
}

export async function POST(req: Request) {
  const parsed = storySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const tags = extractStoryTags(parsed.data.story);
  const story: DiscoverStory = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...parsed.data,
    tags,
  };

  const potentialLinks = getStore().stories
    .map((item) => ({
      id: item.id,
      score: overlapScore(item.tags, story.tags),
    }))
    .filter((entry) => entry.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  getStore().stories.unshift(story);
  await saveStore();

  return NextResponse.json({ item: story, potentialLinks }, { status: 201 });
}
