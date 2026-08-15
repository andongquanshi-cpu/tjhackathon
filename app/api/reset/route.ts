import { NextResponse } from "next/server";
import { buildSeedData } from "@/lib/seed";
import { resetDB, seedDB } from "@/lib/store";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (body.seed) {
    const { notes, profile } = buildSeedData();
    seedDB(notes, profile);
  } else {
    resetDB();
  }
  return NextResponse.json({ ok: true });
}