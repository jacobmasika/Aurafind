import { getStore, saveStore } from "@/lib/storage";
import { SightingReport } from "@/types/domain";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

const sightingSchema = z.object({
  notes: z.string().min(3),
  location: z.object({ lat: z.number(), lng: z.number() }),
  seenAt: z.string(),
  photos: z.array(z.string()).default([]),
  country: z.string().optional(),
});

export async function GET() {
  return NextResponse.json({ items: getStore().sightings });
}

export async function POST(req: Request) {
  const parsed = sightingSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const sighting: SightingReport = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    anonymous: true,
    ...parsed.data,
  };

  getStore().sightings.unshift(sighting);
  await saveStore();

  return NextResponse.json({ item: sighting }, { status: 201 });
}
