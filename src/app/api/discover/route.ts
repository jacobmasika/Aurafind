import { extractStoryTags, overlapScore } from "@/lib/nlp";
import { createStory, listStories } from "@/lib/storage";
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
  const items = await listStories();
  return NextResponse.json({ items });
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

  const existingStories = await listStories();

  const potentialLinks = existingStories
    .map((item) => ({
      id: item.id,
      score: overlapScore(item.tags, story.tags),
    }))
    .filter((entry) => entry.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const item = await createStory(story);

  return NextResponse.json({ item, potentialLinks }, { status: 201 });
}
