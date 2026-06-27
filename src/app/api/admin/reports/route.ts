import { deleteReport, listReports } from "@/lib/storage";
import { NextResponse } from "next/server";

function isAuthorized(request: Request) {
  const configuredPassword = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

  if (!configuredPassword) {
    return process.env.NODE_ENV !== "production";
  }

  const suppliedPassword = request.headers.get("x-admin-password")?.trim();
  return suppliedPassword === configuredPassword;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized admin access." }, { status: 401 });
  }

  try {
    const items = await listReports();
    return NextResponse.json({ items });
  } catch (error) {
    console.error("GET /api/admin/reports failed", error);
    return NextResponse.json({ error: "Failed to load admin reports." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized admin access." }, { status: 401 });
  }

  const url = new URL(request.url);
  const reportId = url.searchParams.get("id");

  if (!reportId) {
    return NextResponse.json({ error: "Missing report id." }, { status: 400 });
  }

  try {
    await deleteReport(reportId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/reports failed", error);
    return NextResponse.json({ error: "Failed to delete report." }, { status: 500 });
  }
}
