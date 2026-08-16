import { chatCompletion, isLLMConfigured } from "./ai";
import { getSchool } from "./personas";
import type { Note, Profile, SessionFeedback } from "./types";

function fallbackFeedback(note: Note): SessionFeedback {
  const school = note.selectedSchool ? getSchool(note.selectedSchool) : null;
  return {
    summary: `你愿意停下来记录「${note.content.slice(0, 42)}${note.content.length > 42 ? "…" : ""}」，这本身就是一次重要的觉察。`,
    highlights: [
      "你开始把感受从脑海里带到可以被看见的地方",
      school ? `你更愿意从${school.school}的视角继续探索` : "不同视角可以同时存在，不必立刻选出唯一答案",
    ],
    suggestedAction: "今天只做一件很小的事：给此刻的感受起一个名字，并留意它在身体里的位置。",
    createdAt: new Date().toISOString(),
  };
}

function extractJson(raw: string): string {
  const start = raw.indexOf("{");
  const finish = raw.lastIndexOf("}");
  if (start < 0 || finish < 0) throw new Error("feedback JSON missing");
  return raw.slice(start, finish + 1);
}

export async function generateSessionFeedback(
  note: Note,
  profile: Profile | null
): Promise<SessionFeedback> {
  if (!isLLMConfigured()) return fallbackFeedback(note);
  try {
    const comments = note.comments?.map((item) => `${getSchool(item.school).name}：${item.text}`).join("\n") ?? "";
    const selected = note.selectedSchool;
    const conversation = selected
      ? (note.conversations[selected] ?? []).slice(-8).map((item) => `${item.role === "user" ? "用户" : getSchool(selected).name}：${item.content}`).join("\n")
      : "";
    const raw = await chatCompletion(
      [
        {
          role: "system",
          content:
            "你是小愈，负责在心理陪伴圆桌结束后生成温和、具体、非诊断性的反馈。只输出严格 JSON。",
        },
        {
          role: "user",
          content: `用户记录：${note.content}
四位导师回应：
${comments}
选中导师与深聊：
${conversation || "尚未深聊"}
画像议题：${profile?.coreIssues.join("、") || "暂无"}

请输出：
{"summary":"80字以内的本轮总结","highlights":["洞察1","洞察2","洞察3"],"suggestedAction":"一个今天可完成的小行动"}`,
        },
      ],
      { temperature: 0.5, maxTokens: 450 }
    );
    const parsed = JSON.parse(extractJson(raw)) as Partial<SessionFeedback>;
    if (!parsed.summary || !Array.isArray(parsed.highlights) || !parsed.suggestedAction) {
      throw new Error("invalid feedback shape");
    }
    return {
      summary: String(parsed.summary),
      highlights: parsed.highlights.slice(0, 4).map(String),
      suggestedAction: String(parsed.suggestedAction),
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[feedback] fallback", error);
    return fallbackFeedback(note);
  }
}
