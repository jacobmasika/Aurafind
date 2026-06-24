import { createSighting, listSightings } from "@/lib/storage";
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
  try {
    const items = await listSightings();
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "Failed to load sightings from Supabase." }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
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

    const item = await createSighting(sighting);

    return NextResponse.json({ item }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to save sighting. Check Supabase key permissions and table policies." },
      { status: 503 },
    );
  }
}
