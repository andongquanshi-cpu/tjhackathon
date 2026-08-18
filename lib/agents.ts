import { chatCompletion, isLLMConfigured } from "./ai";
import { analyzeInput } from "./input-analysis";
import { callExternalAgent, getAgentId } from "./external-agents";
import { getSchool, SCHOOLS, type SchoolPersona } from "./personas";
import { SIX_DIM_META } from "./six-dim";
import type {
  ChatMessage,
  AgentSource,
  Note,
  Profile,
  SchoolComment,
  SchoolId,
} from "./types";

const snippet = (s: string, n = 24) => (s.length > n ? s.slice(0, n) + "…" : s);

export function profileDigest(p: Profile | null): string {
  if (!p?.sixDim) return "用户尚未完成初始测评";
  const dims = SIX_DIM_META.map(
    (d) => `${d.label}${Math.round(p.sixDim.scores[d.key])}`
  ).join("、");
  return `人格：${p.sixDim.personaName}（${p.sixDim.axes.core.label}·${p.sixDim.axes.drive.label}·${p.sixDim.axes.emotion.label}）。六维得分：${dims}。核心议题：${p.coreIssues.join("、") || "暂无"}。认知模式：${p.cognitivePatterns.join("、") || "暂无"}。优势资源：${p.strengths.join("、") || "暂无"}。`;
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
      text = `你已经观察到「${s}」，这本身就是改变的起点。先不要求一次做好：选一个五分钟内能完成的小动作，并把环境提示放得更明显。完成一次，就是给“我做得到”增加一条新证据。`;
      break;
    case "postmodern":
      text = `如果把「${s}」看作一段可观察的行为链，我们可以先找它发生前的提示，以及做完后立即得到的结果。只改一个环节：把目标缩到足够小，并在完成后立刻给自己清晰、温和的反馈。`;
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
      return `你说「${s}」，这说明你已经在观察自己的行动模式了。先选一个最容易成功的小步骤，把它缩到五分钟以内；然后想想，环境里放什么提示能让开始更容易？一次小成功会慢慢积累自我效能感。`;
    case "postmodern":
      return `你说「${s}」。我们先把它写成可观察的行为：在什么提示出现后，你做了什么，紧接着得到了什么结果？找到这条链后，只替换一个环节，再给新行为安排一个即时、温和的反馈。`;
  }
}

// ---------------- 四流派评论 ----------------

export async function generateComments(
  note: Note,
  profile: Profile | null
): Promise<SchoolComment[]> {
  const analysis = analyzeInput({
    input: note.content,
    noteContent: note.content,
    profile,
    storedRisk: note.risk,
  });
  const digest = profileDigest(profile);
  const results = await Promise.allSettled(
    SCHOOLS.map(async (persona) => {
      try {
        const external = await callExternalAgent({
          school: persona.id,
          analysis,
          noteContent: note.content,
          profileDigest: digest,
        });
        if (external) {
          return {
            school: persona.id,
            text: external.response,
            createdAt: new Date().toISOString(),
            agentId: external.agentId,
            skills: external.skills,
            sources: external.sources,
            degraded: external.degraded,
          } satisfies SchoolComment;
        }
      } catch (err) {
        console.error(`[agents] external ${getAgentId(persona.id)} fallback`, err);
      }

      if (isLLMConfigured()) {
        try {
          const text = await chatCompletion(
            [
              { role: "system", content: persona.systemPrompt },
              {
                role: "user",
                content: `用户第 ${note.day} 天的便签：\n「${note.content}」\n\n请用你的流派视角对这段内容给出回应。\n安全等级：${analysis.safetyLevel}；意图：${analysis.intents.join("、")}；主题：${analysis.topics.join("、")}。\n\n用户画像参考：${digest}`,
              },
            ],
            { temperature: 0.8, maxTokens: 400 }
          );
          return {
            school: persona.id,
            text,
            createdAt: new Date().toISOString(),
            agentId: getAgentId(persona.id),
            skills: ["local-role-fallback"],
            sources: [],
            degraded: true,
          } satisfies SchoolComment;
        } catch (err) {
          console.error(`[agents] comment fallback (${persona.id})`, err);
        }
      }
      return {
        ...mockComment(persona, note.content),
        agentId: getAgentId(persona.id),
        skills: ["local-template-fallback"],
        sources: [],
        degraded: true,
      } satisfies SchoolComment;
    })
  );

  return results.map((result, index) =>
    result.status === "fulfilled"
      ? result.value
      : {
          ...mockComment(SCHOOLS[index], note.content),
          agentId: getAgentId(SCHOOLS[index].id),
          skills: ["local-template-fallback"],
          sources: [],
          degraded: true,
        }
  );
}

// ---------------- 深聊 ----------------

export interface AgentTurnResult {
  content: string;
  agentId: "A" | "B" | "C" | "D";
  skills: string[];
  sources: AgentSource[];
  degraded: boolean;
}

export async function chatWithSchool(opts: {
  note: Note;
  school: SchoolId;
  history: ChatMessage[];
  userMsg: string;
  profile: Profile | null;
}): Promise<AgentTurnResult> {
  const persona = getSchool(opts.school);
  const { note, history, userMsg, profile } = opts;
  const analysis = analyzeInput({
    input: userMsg,
    noteContent: note.content,
    history,
    profile,
    storedRisk: note.risk,
  });

  try {
    const external = await callExternalAgent({
      school: opts.school,
      analysis,
      noteContent: note.content,
      profileDigest: profileDigest(profile),
      history,
    });
    if (external) {
      return {
        content: external.response,
        agentId: external.agentId,
        skills: external.skills,
        sources: external.sources,
        degraded: external.degraded,
      };
    }
  } catch (err) {
    console.error(`[agents] external ${getAgentId(opts.school)} chat fallback`, err);
  }

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
      const content = await chatCompletion(msgs, { temperature: 0.8, maxTokens: 600 });
      return {
        content,
        agentId: getAgentId(opts.school),
        skills: ["local-role-fallback"],
        sources: [],
        degraded: true,
      };
    } catch (err) {
      console.error("[agents] chat fallback", err);
    }
  }
  return {
    content: mockChatReply(persona, userMsg, note.content),
    agentId: getAgentId(opts.school),
    skills: ["local-template-fallback"],
    sources: [],
    degraded: true,
  };
}

// ---------------- 画像蒸馏（不改六维分，只沉淀议题/模式/优势/时间线） ----------------

export function heuristicDistill(
  note: Note,
  schoolId: SchoolId | null,
  profile: Profile
): Profile {
  const label = schoolId ? getSchool(schoolId).name : "小愈";
  const entry = schoolId
    ? `Day ${note.day}：与 ${label} 深入对话`
    : `Day ${note.day}：写下便签`;
  const timeline = [...profile.timeline, entry].slice(-30);
  return { ...profile, timeline, updatedAt: new Date().toISOString() };
}

function extractJson(s: string): string {
  const a = s.indexOf("{");
  const b = s.lastIndexOf("}");
  if (a < 0 || b < 0) throw new Error("no json in llm output");
  return s.slice(a, b + 1);
}

function mergeDistill(base: Profile, parsed: Record<string, unknown>): Profile {
  const add = (arr: string[], list: unknown): string[] =>
    [
      ...arr,
      ...(Array.isArray(list)
        ? list.map(String).filter((s) => s && !arr.includes(s))
        : []),
    ].slice(0, 20);
  return {
    ...base,
    coreIssues: add(base.coreIssues, parsed.coreIssues),
    cognitivePatterns: add(base.cognitivePatterns, parsed.cognitivePatterns),
    strengths: add(base.strengths, parsed.strengths),
  };
}

/** 深聊后更新画像：LLM 蒸馏 + 启发式兜底（六维分只由测评锁定） */
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
    const prompt = `以下是用户与「${persona.name}」（${persona.school}）围绕便签「${snippet(note.content, 40)}」的对话。请从对话中提炼画像增量，只输出 JSON（不要改动六维分数）：
{
  "coreIssues": ["新增或得到确认的核心议题，不重复已有"],
  "cognitivePatterns": ["观察到的认知模式"],
  "strengths": ["观察到的优势资源"]
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