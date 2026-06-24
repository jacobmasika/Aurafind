import { getReportById } from "@/lib/storage";
import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  reportId: z.string().min(1),
});

export async function POST(req: Request) {
  const parsed = requestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const report = await getReportById(parsed.data.reportId);
  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const authorityPayload = {
    caseId: report.id,
    subject: report.person.fullName,
    age: report.person.age ?? null,
    lastSeenAt: report.lastSeenAt,
    lastKnownLocation: report.lastKnownLocation,
    reporter: {
      name: report.reporterName,
      email: report.reporterEmail,
      phone: report.reporterPhone,
    },
  };

  return NextResponse.json({
    status: "queued",
    authorityPayload,
    channels: {
      webhook: "simulated",
      sms: process.env.TWILIO_ACCOUNT_SID ? "configured" : "not-configured",
      email: process.env.RESEND_API_KEY ? "configured" : "not-configured",
    },
  });
}
