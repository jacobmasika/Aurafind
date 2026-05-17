import { getStore } from "@/lib/storage";
import { FoundRegisterEntry } from "@/types/domain";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

const foundSchema = z.object({
  registrarOrg: z.string().min(2),
  registrarContact: z.string().min(3),
  notes: z.string().min(3),
  location: z.object({ lat: z.number(), lng: z.number() }),
  estimatedAge: z.number().int().positive().optional(),
  photos: z.array(z.string()).default([]),
});

export async function GET() {
  return NextResponse.json({ items: getStore().found });
}

export async function POST(req: Request) {
  const parsed = foundSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const entry: FoundRegisterEntry = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...parsed.data,
  };

  getStore().found.unshift(entry);

  return NextResponse.json({ item: entry }, { status: 201 });
}
