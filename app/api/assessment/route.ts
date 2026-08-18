import { NextResponse } from "next/server";
import { scoreSixDim, describePersonaParagraph } from "@/lib/six-dim";
import { SIX_DIM_QUESTIONS } from "@/lib/six-dim/questions";
import { getProfile, setProfile } from "@/lib/store";
import type { Profile } from "@/lib/types";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const answers = (body.answers ?? {}) as Record<string, number>;

  const missing = SIX_DIM_QUESTIONS.filter((q) => !Number.isFinite(Number(answers[q.id])));
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `还有 ${missing.length} 题未作答`, missing: missing.map((q) => q.id) },
      { status: 400 }
    );
  }

  const result = scoreSixDim(answers);
  const now = new Date().toISOString();
  const existing = getProfile();

  const profile: Profile = {
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    sixDim: {
      scores: result.scores,
      axes: result.axes,
      personaId: result.personaId,
      personaName: result.personaName,
      personaTagline: result.personaTagline,
      assessedAt: now,
      answers,
      report: describePersonaParagraph(result),
    },
    coreIssues: existing?.coreIssues ?? [],
    cognitivePatterns: existing?.cognitivePatterns ?? [],
    strengths: existing?.strengths ?? [],
    timeline: [
      ...(existing?.timeline ?? []),
      `完成六维测评：${result.personaName}（${result.axes.core.label}·${result.axes.drive.label}·${result.axes.emotion.label}）`,
    ].slice(-30),
  };

  setProfile(profile);
  return NextResponse.json({ profile, result });
}
