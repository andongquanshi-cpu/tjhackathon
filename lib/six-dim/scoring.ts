import { getPersona12 } from "./personas";
import {
  SIX_DIM_MAX,
  SIX_DIM_META,
  SIX_DIM_MIN,
  SIX_DIM_THRESHOLD,
  type CoreAxis,
  type DriveAxis,
  type EmotionAxis,
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

export interface SixDimAxes {
  core: { score: number; label: CoreAxis };
  drive: { score: number; label: DriveAxis };
  emotion: { score: number; label: EmotionAxis };
}

export interface SixDimResult {
  scores: Record<SixDimKey, number>;
  axes: SixDimAxes;
  personaId: number;
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

function axisCore(score: number): CoreAxis {
  return score >= 24 ? "自稳" : "外求";
}

function axisDrive(score: number): DriveAxis {
  return score >= 24 ? "冲锋" : "运筹";
}

function axisEmotion(score: number): EmotionAxis {
  if (score >= 30) return "炽热";
  if (score >= 19) return "温和";
  return "冷静";
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

  const coreScore = scores.agency + scores.attachment;
  const driveScore = scores.action + scores.processing;
  const emotionScore = scores.defense + (24 - scores.decision);

  const axes: SixDimAxes = {
    core: { score: coreScore, label: axisCore(coreScore) },
    drive: { score: driveScore, label: axisDrive(driveScore) },
    emotion: { score: emotionScore, label: axisEmotion(emotionScore) },
  };

  const persona = getPersona12(axes.core.label, axes.drive.label, axes.emotion.label);

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
    axes,
    personaId: persona.id,
    personaName: persona.name,
    personaTagline: persona.tagline,
    cards,
  };
}

export function sixDimPercent(score: number): number {
  return Math.round(((score - SIX_DIM_MIN) / (SIX_DIM_MAX - SIX_DIM_MIN)) * 100);
}

export function describePersonaParagraph(result: SixDimResult): string {
  const { axes, personaName, personaTagline } = result;
  const highs = result.cards
    .filter((c) => c.level === "high")
    .map((c) => SIX_DIM_META.find((d) => d.key === c.key)?.label);
  const lows = result.cards
    .filter((c) => c.level === "low")
    .map((c) => SIX_DIM_META.find((d) => d.key === c.key)?.label);
  const highText = highs.length ? highs.join("、") : "暂无明显高分维度";
  const lowText = lows.length ? lows.join("、") : "各维都还算平衡";
  return `你更接近「${personaName}」——${personaTagline}。三轴画像：内核${axes.core.label}、行动${axes.drive.label}、情绪${axes.emotion.label}。你在「${highText}」上更鲜明，而「${lowText}」可以温柔留意。这不是标签，只是一张此刻的地图。`;
}
