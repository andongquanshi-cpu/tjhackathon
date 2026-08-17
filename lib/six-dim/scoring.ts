import { getPersona } from "./personas";
import {
  SIX_DIM_MAX,
  SIX_DIM_META,
  SIX_DIM_MIN,
  SIX_DIM_THRESHOLD,
  type SixDimKey,
} from "./meta";
import { SIX_DIM_QUESTIONS } from "./questions";

export type SixDimLevel = "high" | "mid" | "low";

export interface SixDimScoreCard {
  key: SixDimKey;
  score: number;
  bit: 0 | 1;
  level: SixDimLevel;
  poleLabel: string;
  blurb: string;
}

export interface SixDimResult {
  scores: Record<SixDimKey, number>;
  bits: string;
  letterCode: string;
  personaName: string;
  personaTagline: string;
  cards: SixDimScoreCard[];
}

function clampAnswer(raw: number): number {
  return Math.max(1, Math.min(5, Math.round(raw)));
}

function itemScore(questionId: string, raw: number): number {
  const q = SIX_DIM_QUESTIONS.find((item) => item.id === questionId);
  if (!q) return 0;
  const value = clampAnswer(raw);
  if (q.kind === "scenario") return value;
  return q.reverse ? 6 - value : value;
}

function levelOf(score: number): SixDimLevel {
  if (score >= 16) return "high";
  if (score >= 10) return "mid";
  return "low";
}

export function scoreSixDim(answers: Record<string, number>): SixDimResult {
  const scores = Object.fromEntries(SIX_DIM_META.map((d) => [d.key, 0])) as Record<SixDimKey, number>;

  for (const q of SIX_DIM_QUESTIONS) {
    const raw = Number(answers[q.id]);
    if (!Number.isFinite(raw)) continue;
    scores[q.dim] += itemScore(q.id, raw);
  }

  for (const d of SIX_DIM_META) {
    scores[d.key] = Math.max(SIX_DIM_MIN, Math.min(SIX_DIM_MAX, scores[d.key]));
  }

  const bits = SIX_DIM_META.map((d) => (scores[d.key] >= SIX_DIM_THRESHOLD ? "1" : "0")).join("");
  const letterParts = SIX_DIM_META.map((d) =>
    scores[d.key] >= SIX_DIM_THRESHOLD ? d.letterA : d.letterB
  );
  const computedLetter =
    `${letterParts.slice(0, 3).join("")} ${letterParts.slice(3).join("")}`.trim();
  const persona = getPersona(bits);

  const cards: SixDimScoreCard[] = SIX_DIM_META.map((d) => {
    const score = scores[d.key];
    const bit = (score >= SIX_DIM_THRESHOLD ? 1 : 0) as 0 | 1;
    return {
      key: d.key,
      score,
      bit,
      level: levelOf(score),
      poleLabel: bit === 1 ? d.poleA : d.poleB,
      blurb: bit === 1 ? d.blurbA : d.blurbB,
    };
  });

  return {
    scores,
    bits,
    letterCode: persona.letterCode || computedLetter,
    personaName: persona.name,
    personaTagline: persona.tagline,
    cards,
  };
}

export function sixDimPercent(score: number): number {
  return Math.round(((score - SIX_DIM_MIN) / (SIX_DIM_MAX - SIX_DIM_MIN)) * 100);
}

export function describePersonaParagraph(result: SixDimResult): string {
  const highs = result.cards
    .filter((c) => c.level === "high")
    .map((c) => SIX_DIM_META.find((d) => d.key === c.key)?.label);
  const lows = result.cards
    .filter((c) => c.level === "low")
    .map((c) => SIX_DIM_META.find((d) => d.key === c.key)?.label);
  const highText = highs.length ? highs.join("、") : "暂无明显高分维度";
  const lowText = lows.length ? lows.join("、") : "各维都还算平衡";
  return `${result.personaTagline} 你在「${highText}」上更鲜明，而「${lowText}」可能是接下来可以温柔留意的地方。这不是标签，只是一张此刻的地图。`;
}
