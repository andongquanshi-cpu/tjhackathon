import type { DimKey } from "./types";

export interface Question {
  id: string;
  dim: DimKey;
  text: string;
  /** 反向计分题 */
  reverse?: boolean;
}

export const DIM_META: { key: DimKey; label: string; color: string; hint: string }[] = [
  { key: "emotion", label: "情绪稳定", color: "#f43f5e", hint: "情绪的起伏与回归平静的能力" },
  { key: "stress", label: "压力应对", color: "#f59e0b", hint: "面对任务与压力的松弛度" },
  { key: "selfCare", label: "自我关怀", color: "#10b981", hint: "对自己温柔、允许休息的程度" },
  { key: "connection", label: "社会连接", color: "#0ea5e9", hint: "被支持感与孤独感" },
  { key: "mindfulness", label: "正念觉察", color: "#8b5cf6", hint: "对当下情绪与身体的觉察" },
];

export const QUESTIONS: Question[] = [
  { id: "q1", dim: "emotion", text: "最近一周，我能觉察到情绪正在发生变化，而不是立刻被它带走。" },
  { id: "q2", dim: "stress", text: "事情很多的时候，我仍能找到一点让自己喘息的空间。" },
  { id: "q3", dim: "selfCare", text: "当我没有做好一件事时，我愿意像对待朋友一样对待自己。" },
];

/** 5 点计分（1=非常不符合 ~ 5=非常符合），映射到 0-100 */
export function scoreAnswers(answers: Record<string, number>): Record<DimKey, number> {
  const acc: Record<DimKey, { sum: number; count: number }> = {
    emotion: { sum: 0, count: 0 },
    stress: { sum: 0, count: 0 },
    selfCare: { sum: 0, count: 0 },
    connection: { sum: 0, count: 0 },
    mindfulness: { sum: 0, count: 0 },
  };
  for (const q of QUESTIONS) {
    const raw = Number(answers[q.id]);
    if (!Number.isFinite(raw)) continue;
    const val = q.reverse ? 6 - Math.max(1, Math.min(5, raw)) : Math.max(1, Math.min(5, raw));
    acc[q.dim].sum += val;
    acc[q.dim].count += 1;
  }
  const out = {} as Record<DimKey, number>;
  for (const d of DIM_META) {
    const { sum, count } = acc[d.key];
    out[d.key] = count === 0 ? 50 : Math.round(((sum / count - 1) / 4) * 100);
  }
  return out;
}