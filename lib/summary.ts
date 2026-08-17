import { chatCompletion, isLLMConfigured } from "./ai";
import { profileDigest } from "./agents";
import type { Note, Profile } from "./types";
import { SIX_DIM_META } from "./six-dim";

const snippet = (s: string, n = 30) => (s.length > n ? s.slice(0, n) + "…" : s);

export function mockSummary(profile: Profile, notes: Note[], phase: number): string {
  const dims = profile.sixDim
    ? SIX_DIM_META.map((d) => `${d.label}${Math.round(profile.sixDim.scores[d.key])}`).join("、")
    : "尚未完成六维测评";
  const topIssue = profile.coreIssues[0] ?? "还没浮现出特别明显的议题";
  const strength = profile.strengths[0] ?? "愿意持续记录";
  const recent = notes.slice(-3).reverse();
  const noteLines = recent.length
    ? recent.map((n) => `· Day ${n.day}：「${snippet(n.content)}」`).join("\n")
    : "（还没有便签记录）";

  return `第 ${phase} 天 · 阶段小结

这 ${Math.min(phase, Math.max(notes.length, 1))} 天里，你写下了 ${notes.length} 张便签。最近的记录：

${noteLines}

六维画像：${profile.sixDim ? `${profile.sixDim.personaName}（${profile.sixDim.letterCode}）` : "未测评"}；维度：${dims}。

目前最常出现的议题是「${topIssue}」，而我看到你身上一直亮着的资源是「${strength}」——它不是别人给的，是你自己带进来的。

下一阶段，小愈想陪你做一件事：把「看见」变成「一小步行动」。不用很大，够得着就好。

—— 小愈`;
}

export async function generatePhaseSummary(
  profile: Profile,
  notes: Note[],
  phase: number
): Promise<{ summary: string; phase: number }> {
  if (isLLMConfigured()) {
    try {
      const recent = notes.slice(-5).reverse();
      const lines = recent.length
        ? recent.map((n) => `Day ${n.day}：「${n.content}」`).join("\n")
        : "无";
      const prompt = `请为 21 天正念训练营第 ${phase} 天写一份阶段小结（300-400 字），语气温暖真诚，结合用户画像与近期便签，指出变化、肯定资源，并给下一阶段一个具体的小建议。\n\n用户画像：${profileDigest(profile)}\n\n近期便签：\n${lines}`;
      const summary = await chatCompletion(
        [
          {
            role: "system",
            content:
              "你是「小愈」，21 天正念训练营的陪伴者。写中文，温暖、具体、不鸡汤，不诊断。",
          },
          { role: "user", content: prompt },
        ],
        { temperature: 0.8, maxTokens: 700 }
      );
      return { summary, phase };
    } catch (err) {
      console.error("[summary] llm failed, fallback mock", err);
    }
  }
  return { summary: mockSummary(profile, notes, phase), phase };
}
