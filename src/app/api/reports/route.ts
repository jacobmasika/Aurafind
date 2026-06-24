import { createReport, listReports } from "@/lib/storage";
import { MissingReport } from "@/types/domain";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

const reportSchema = z.object({
  reporterName: z.string().min(2),
  reporterEmail: z.email(),
  reporterPhone: z.string().optional(),
  lastKnownLocation: z
    .object({ lat: z.number(), lng: z.number() })
    .optional()
    .default({ lat: 0, lng: 0 }),
  lastKnownLocationName: z.string().optional(),
  lastSeenAt: z.string().optional().default(() => new Date().toISOString()),
  person: z.object({
    fullName: z.string().min(2),
    age: z.number().int().positive().optional(),
    heightCm: z.number().int().positive().optional(),
    eyeColor: z.string().optional(),
    hairColor: z.string().optional(),
    distinguishingMarks: z.string().optional(),
    clothingDescription: z.string().optional(),
    languages: z.array(z.string()).optional(),
  }),
  photos: z.array(z.string()).default([]),
  voiceTranscript: z.string().optional(),
  exif: z.record(z.string(), z.unknown()).optional(),
});

export async function GET() {
  try {
    const items = await listReports();
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "Failed to load reports from Supabase." }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const parsed = reportSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const report: MissingReport = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      status: "missing",
      ...parsed.data,
    };

    const item = await createReport(report);

    return NextResponse.json({ item }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to save report. Check Supabase key permissions and table policies." },
      { status: 503 },
    );
  }
}
