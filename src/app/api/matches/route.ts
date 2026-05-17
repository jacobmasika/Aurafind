import { scoreCandidate } from "@/lib/matching";
import { getStore } from "@/lib/storage";
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

  const report = getStore().reports.find((item) => item.id === parsed.data.reportId);
  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const results: MatchResult[] = [];

  for (const sighting of getStore().sightings) {
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

  for (const foundEntry of getStore().found) {
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
