import { getPersistenceMode, hasSupabaseConfiguration, listReports } from "@/lib/storage";
import { NextResponse } from "next/server";

export async function GET() {
  const persistence = getPersistenceMode();
  const supabaseConfigured = hasSupabaseConfiguration();

  try {
    // Lightweight read proves database connectivity when Supabase mode is active.
    if (persistence === "supabase") {
      await listReports();
    }

    return NextResponse.json({ status: "ok", service: "AuraFind", persistence, supabaseConfigured });
  } catch {
    return NextResponse.json({ status: "degraded", service: "AuraFind", persistence, supabaseConfigured }, { status: 503 });
  }
}
