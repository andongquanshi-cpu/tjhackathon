import { NextResponse } from "next/server";
import { generatePhaseSummary } from "@/lib/summary";
import { getNotes, getProfile } from "@/lib/store";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const phase = Math.max(7, Math.min(21, Number(body.phase) || 7));
  const profile = getProfile();
  if (!profile) {
    return NextResponse.json({ error: "请先完成初始测评" }, { status: 400 });
  }
  const result = await generatePhaseSummary(profile, getNotes(), phase);
  return NextResponse.json(result);
}