import { chatCompletion, isLLMConfigured } from "./ai";
import { getSchool, SCHOOLS, type SchoolPersona } from "./personas";
import { DIM_META } from "./assessment";
import type {
  ChatMessage,
  DimKey,
  Note,
  Profile,
  SchoolComment,
  SchoolId,
} from "./types";

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const snippet = (s: string, n = 24) => (s.length > n ? s.slice(0, n) + "…" : s);

export function profileDigest(p: Profile | null): string {
  if (!p) return "用户尚未完成初始测评";
  const dims = DIM_META.map((d) => `${d.label}${Math.round(p.dimensions[d.key])}`).join("、");
  return `画像维度：${dims}。核心议题：${p.coreIssues.join("、") || "暂无"}。认知模式：${p.cognitivePatterns.join("、") || "暂无"}。优势资源：${p.strengths.join("、") || "暂无"}。`;
}

// ---------------- Mock（仅当 LLM 不可用时兜底） ----------------

export function mockComment(persona: SchoolPersona, content: string): SchoolComment {
  const s = snippet(content);
  const now = new Date().toISOString();
  let text: string;
  switch (persona.id) {
    case "humanistic":
      text = `我听到你在说：「${s}」。这句话里有一种很真实的疲惫，我能感觉到你一直在撑着。先不急着分析，我想先抱抱那个累了的你——你已经很努力了。如果此刻你能允许自己停一下，你最想让谁来陪陪你？`;
      break;
    case "psychodynamic":
      text = `「${s}」——你把它写下来的时候，我好奇：这种「停不下来」的感觉，是不是在更早的时候也出现过？那时候你多大？身边是谁？也许它不只是一次加班带来的累，而是一个老朋友式的模式。我们可以沿着它慢慢看看。`;
      break;
    case "cognitive":
      text = `我在你写下的「${s}」里，捕捉到一个想法：「自己像一台机器」。我们一起来检验它：支持这个想法的证据是什么？有没有反例，比如今天某个瞬间你其实是自己的主人？如果最坏、最好、最可能的情况各是什么，你会怎么选一个更平衡的视角？`;
      break;
    case "postmodern":
      text = `「${s}」——我想先把它和「你」分开来看：这个让你停不下来的东西，也许不该叫「你」，它可以有自己的名字。你有没有留意过，什么时候它不在？哪怕只有一小会儿。如果换一种讲法，你会怎么讲今天的自己？`;
      break;
  }
  return { school: persona.id, text, createdAt: now };
}

export function mockChatReply(
  persona: SchoolPersona,
  userMsg: string,
  noteContent: string
): string {
  const s = snippet(userMsg, 20);
  switch (persona.id) {
    case "humanistic":
      return `谢谢你愿意继续和我说。你刚刚说「${s}」——我听到的重点是，你不仅累，还有一种「不被允许停下来」的感觉。这种感觉里，你更希望被理解的是哪一部分？是「我真的很累」，还是「我不知道怎么停下来」？`;
    case "psychodynamic":
      return `「${s}」——这让我更想和你一起看看：这种模式是从什么时候开始成为你的「默认设置」的？你提到过那种停不下来的感觉。试着回想一下，在你成长的过程里，有没有一个时刻，你觉得「我必须一直努力才安全」？`;
    case "cognitive":
      return `你说了「${s}」，很好，这就是觉察的开始。我们接着用三个问题来检验这个想法：1) 证据是什么？2) 有没有反例？3) 如果好朋友陷入同样的想法，你会怎么帮他？你可以先只回答第一个，我陪你一步步来。`;
    case "postmodern":
      return `你说「${s}」。在叙事疗法里，我们相信你不是问题，问题才是问题。试着给它起个名字？然后我想问你一个关于「例外」的问题：过去这段时间，有没有哪一刻它没有控制你？那时你在做什么？`;
  }
}

// ---------------- 四流派评论 ----------------

export async function generateComments(
  note: Note,
  profile: Profile | null
): Promise<SchoolComment[]> {
  if (isLLMConfigured()) {
    const results = await Promise.all(
      SCHOOLS.map(async (persona) => {
        try {
          const text = await chatCompletion(
            [
              { role: "system", content: persona.systemPrompt },
              {
                role: "user",
                content: `用户第 ${note.day} 天的便签：\n「${note.content}」\n\n请用你的流派视角对这段内容给出回应。\n\n用户画像参考：${profileDigest(profile)}`,
              },
            ],
            { temperature: 0.8, maxTokens: 400 }
          );
          return { school: persona.id, text, createdAt: new Date().toISOString() };
        } catch (err) {
          console.error(`[agents] comment fallback (${persona.id})`, err);
          return mockComment(persona, note.content);
        }
      })
    );
    return results;
  }
  return SCHOOLS.map((p) => mockComment(p, note.content));
}

// ---------------- 深聊 ----------------

export async function chatWithSchool(opts: {
  note: Note;
  school: SchoolId;
  history: ChatMessage[];
  userMsg: string;
  profile: Profile | null;
}): Promise<string> {
  const persona = getSchool(opts.school);
  const { note, history, userMsg, profile } = opts;

  if (isLLMConfigured()) {
    try {
      const sys =
        persona.systemPrompt +
        `\n\n用户本次便签：\n「${note.content}」\n\n用户画像参考：${profileDigest(profile)}`;
      const msgs = [
        { role: "system" as const, content: sys },
        ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user" as const, content: userMsg },
      ];
      return await chatCompletion(msgs, { temperature: 0.8, maxTokens: 600 });
    } catch (err) {
      console.error("[agents] chat fallback", err);
    }
  }
  return mockChatReply(persona, userMsg, note.content);
}

// ---------------- 画像蒸馏 ----------------

const DIM_BY_SCHOOL: Record<SchoolId, Partial<Record<DimKey, number>>> = {
  humanistic: { selfCare: 1.5, emotion: 0.5 },
  psychodynamic: { emotion: 1 },
  cognitive: { stress: 1, mindfulness: 0.5 },
  postmodern: { emotion: 1, mindfulness: 0.5 },
};

export function heuristicDistill(
  note: Note,
  schoolId: SchoolId | null,
  profile: Profile
): Profile {
  const dims = { ...profile.dimensions };
  dims.mindfulness = clamp(dims.mindfulness + 1);
  if (schoolId) {
    for (const [k, v] of Object.entries(DIM_BY_SCHOOL[schoolId])) {
      dims[k as DimKey] = clamp(dims[k as DimKey] + (v as number));
    }
  }
  const label = schoolId ? getSchool(schoolId).name : "小愈";
  const entry = schoolId
    ? `Day ${note.day}：与 ${label} 深入对话`
    : `Day ${note.day}：写下便签`;
  const timeline = [...profile.timeline, entry].slice(-30);
  return { ...profile, dimensions: dims, timeline, updatedAt: new Date().toISOString() };
}

function extractJson(s: string): string {
  const a = s.indexOf("{");
  const b = s.lastIndexOf("}");
  if (a < 0 || b < 0) throw new Error("no json in llm output");
  return s.slice(a, b + 1);
}

function mergeDistill(base: Profile, parsed: Record<string, unknown>): Profile {
  const dims = { ...base.dimensions };
  const deltas = parsed.dimensionDeltas as Record<string, unknown> | undefined;
  if (deltas && typeof deltas === "object") {
    for (const d of DIM_META) {
      const v = Number(deltas[d.key]);
      if (Number.isFinite(v)) dims[d.key] = clamp(dims[d.key] + v);
    }
  }
  const add = (arr: string[], list: unknown): string[] =>
    [
      ...arr,
      ...(Array.isArray(list)
        ? list.map(String).filter((s) => s && !arr.includes(s))
        : []),
    ].slice(0, 20);
  return {
    ...base,
    dimensions: dims,
    coreIssues: add(base.coreIssues, parsed.coreIssues),
    cognitivePatterns: add(base.cognitivePatterns, parsed.cognitivePatterns),
    strengths: add(base.strengths, parsed.strengths),
  };
}

/** 深聊后更新画像：LLM 蒸馏 + 启发式兜底 */
export async function distillAfterChat(
  note: Note,
  schoolId: SchoolId,
  profile: Profile,
  history: ChatMessage[]
): Promise<Profile> {
  const base = heuristicDistill(note, schoolId, profile);
  if (!isLLMConfigured() || history.length === 0) return base;

  try {
    const persona = getSchool(schoolId);
    const conv = history
      .slice(-8)
      .map((m) => `${m.role === "user" ? "用户" : persona.name}：${m.content}`)
      .join("\n");
    const prompt = `以下是用户与「${persona.name}」（${persona.school}）围绕便签「${snippet(note.content, 40)}」的对话。请从对话中提炼画像增量，只输出 JSON：
{
  "coreIssues": ["新增或得到确认的核心议题，不重复已有"],
  "cognitivePatterns": ["观察到的认知模式"],
  "strengths": ["观察到的优势资源"],
  "dimensionDeltas": {"emotion": 0, "stress": 0, "selfCare": 0, "connection": 0, "mindfulness": 0}
}
已有核心议题：${profile.coreIssues.join("、") || "无"}
已有认知模式：${profile.cognitivePatterns.join("、") || "无"}
已有优势：${profile.strengths.join("、") || "无"}

对话内容：
${conv}`;
    const raw = await chatCompletion(
      [
        { role: "system", content: "你是用户心理画像的提炼引擎，输出严格 JSON，不要有多余文字。" },
        { role: "user", content: prompt },
      ],
      { temperature: 0.2, maxTokens: 400 }
    );
    return mergeDistill(base, JSON.parse(extractJson(raw)) as Record<string, unknown>);
  } catch (err) {
    console.error("[agents] distill fallback", err);
    return base;
  }
}