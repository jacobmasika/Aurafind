import { getPersistenceMode, listReports } from "@/lib/storage";
import { NextResponse } from "next/server";

export async function GET() {
  const persistence = getPersistenceMode();

  try {
    // Lightweight read proves database connectivity when Supabase mode is active.
    if (persistence === "supabase") {
      await listReports();
    }

    return NextResponse.json({ status: "ok", service: "AuraFind", persistence });
  } catch {
    return NextResponse.json({ status: "degraded", service: "AuraFind", persistence }, { status: 503 });
  }
}
