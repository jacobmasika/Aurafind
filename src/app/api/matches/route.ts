import { scoreCandidate } from "@/lib/matching";
import { getReportById, listFound, listSightings } from "@/lib/storage";
import { MatchResult } from "@/types/domain";
import { NextResponse } from "next/server";
import { z } from "zod";

const reqSchema = z.object({
  reportId: z.string().min(1),
});

export async function POST(req: Request) {
  const parsed = reqSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const report = await getReportById(parsed.data.reportId);
  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const [sightings, foundEntries] = await Promise.all([listSightings(), listFound()]);

  const results: MatchResult[] = [];

  for (const sighting of sightings) {
    results.push(
      scoreCandidate({
        report,
        candidateId: sighting.id,
        sourceType: "sighting",
        location: sighting.location,
        seenAt: sighting.seenAt,
        similaritySeed: sighting.notes,
      }),
    );
  }

  for (const foundEntry of foundEntries) {
    results.push(
      scoreCandidate({
        report,
        candidateId: foundEntry.id,
        sourceType: "found",
        location: foundEntry.location,
        seenAt: foundEntry.createdAt,
        similaritySeed: foundEntry.notes,
      }),
    );
  }

  const sorted = results.sort((a, b) => b.score - a.score).slice(0, 10);

  return NextResponse.json({ items: sorted, alertsTriggered: sorted.filter((item) => item.shouldAlert).length });
}
