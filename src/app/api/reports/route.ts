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

function mapValidationIssues(error: z.ZodError) {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const path = issue.path.join(".");
    let key = path;

    if (path === "person.fullName") key = "fullName";
    if (path === "person.age") key = "age";
    if (path === "person.heightCm") key = "heightCm";

    if (!fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }

  const flattened = error.flatten();

  return {
    message: "Please fix the highlighted fields and try again.",
    fieldErrors,
    formErrors: flattened.formErrors,
    issues: error.issues,
  };
}

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
      return NextResponse.json({ error: mapValidationIssues(parsed.error) }, { status: 400 });
    }

    const report: MissingReport = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      status: "missing",
      ...parsed.data,
    };

    const item = await createReport(report);

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
  console.error("POST /api/reports failed");
  console.error(error);

  return NextResponse.json(
    {
      error: {
        message: "Failed to save report",
        detail:
          error instanceof Error
            ? error.message
            : JSON.stringify(error, null, 2),
      },
    },
    { status: 500 }
  );
}
  }

