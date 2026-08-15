import { NextResponse } from "next/server";
import { scoreAnswers } from "@/lib/assessment";
import { setProfile } from "@/lib/store";
import type { Profile } from "@/lib/types";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const answers = (body.answers ?? {}) as Record<string, number>;

  const now = new Date().toISOString();
  const profile: Profile = {
    createdAt: now,
    updatedAt: now,
    dimensions: scoreAnswers(answers),
    coreIssues: [],
    cognitivePatterns: [],
    strengths: [],
    timeline: ["Day 1：完成初始测评，建立伊始画像"],
  };
  setProfile(profile);
  return NextResponse.json({ profile });
}