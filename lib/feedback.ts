import { chatCompletion, isLLMConfigured } from "./ai";
import { getSchool, SCHOOLS } from "./personas";
import type { MentorTalkSummary, Note, Profile, SchoolId, SessionFeedback } from "./types";
import { isSessionFeedbackV2 } from "./types";

export { isSessionFeedbackV2 };

export const MOOD_LABELS: Record<number, string> = {
  1: "低落",
  2: "疲惫",
  3: "平稳",
  4: "不错",
  5: "晴朗",
};

function shanghaiParts(iso: string): { ymd: string; hms: string; ms: number } {
  const date = new Date(iso);
  const ms = date.getTime();
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .replace(/-/g, "/");
  const hms = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(/:/g, "/");
  return { ymd, hms, ms };
}

function collectTimestamps(note: Note): string[] {
  const stamps = [note.createdAt];
  for (const comment of note.comments ?? []) stamps.push(comment.createdAt);
  for (const school of SCHOOLS) {
    for (const msg of note.conversations[school.id] ?? []) stamps.push(msg.createdAt);
  }
  return stamps.filter(Boolean);
}

export function buildSessionTimeRange(note: Note, endedAt = new Date().toISOString()): string {
  const stamps = collectTimestamps(note);
  stamps.push(endedAt);
  const parsed = stamps.map(shanghaiParts).sort((a, b) => a.ms - b.ms);
  const start = parsed[0];
  const end = parsed[parsed.length - 1];
  return `${start.ymd} ${start.hms} to ${end.hms}`;
}

function volumeOf(text: string): number {
  return text.replace(/\s+/g, "").length;
}

/** 只收录用户实际谈心的导师；多位时按对话量从多到少。无深聊则仅保留所选导师的圆桌回应。 */
export function rankMentorsForFeedback(note: Note): {
  school: SchoolId;
  mentorName: string;
  transcript: string;
  volume: number;
}[] {
  const deep = SCHOOLS.map((school) => {
    const messages = note.conversations[school.id] ?? [];
    const userTurns = messages.filter((item) => item.role === "user").length;
    const transcript = messages
      .map((item) => `${item.role === "user" ? "用户" : school.name}：${item.content}`)
      .join("\n");
    return {
      school: school.id,
      mentorName: school.name,
      transcript,
      volume: volumeOf(transcript),
      messageCount: messages.length,
      userTurns,
    };
  }).filter((item) => item.userTurns > 0);

  if (deep.length > 0) {
    return deep
      .sort((a, b) => b.volume - a.volume || b.userTurns - a.userTurns)
      .map(({ school, mentorName, transcript, volume }) => ({ school, mentorName, transcript, volume }));
  }

  const focusId =
    note.selectedSchool ??
    (note.comments?.length === 1 ? note.comments[0].school : undefined);

  if (focusId) {
    const school = getSchool(focusId);
    const comment = note.comments?.find((item) => item.school === focusId);
    const transcript = comment
      ? `用户便签：${note.content}\n${school.name}（圆桌回应）：${comment.text}`
      : `用户便签：${note.content}`;
    return [
      {
        school: focusId,
        mentorName: school.name,
        transcript,
        volume: volumeOf(transcript),
      },
    ];
  }

  // 仅看过圆桌、未点进任何导师：合并成一条，不把四位拆成四条 records
  const roundtable = (note.comments ?? [])
    .map((comment) => `${getSchool(comment.school).name}：${comment.text}`)
    .join("\n");
  const transcript = `用户便签：${note.content}${roundtable ? `\n圆桌回应：\n${roundtable}` : ""}`;
  return [
    {
      school: (note.comments?.[0]?.school ?? "humanistic") as SchoolId,
      mentorName: "圆桌",
      transcript,
      volume: volumeOf(transcript),
    },
  ];
}

export function feedbackMatchesSession(note: Note, feedback: SessionFeedback): boolean {
  const ranked = rankMentorsForFeedback(note).map((item) => item.school).join("|");
  const recorded = feedback.talkSummaries.map((item) => item.school).join("|");
  return ranked === recorded;
}

function defaultXiaoyuNote(moodLabel: string): string {
  const map: Record<string, string> = {
    低落: "低落也值得被好好抱住；你已经来到圆桌，这一步本身就是光。",
    疲惫: "累了就先把肩膀放下来。今天你愿意停一停，已经很温柔了。",
    平稳: "平稳的日子里，也允许一点点好奇轻轻长出来。",
    不错: "这份不错可以留下来；让它在呼吸里多停一会儿。",
    晴朗: "晴朗很好，也记得给自己一点柔软的空隙。",
  };
  return map[moodLabel] ?? "无论此刻怎样，你都被允许慢慢来。";
}

function fallbackTalkSummaries(note: Note): MentorTalkSummary[] {
  return rankMentorsForFeedback(note).map((item) => ({
    school: item.school,
    mentorName: item.mentorName,
    volume: item.volume,
    summary:
      item.transcript.length > 120
        ? `${item.transcript.slice(0, 118)}…`
        : item.transcript || `围绕便签「${note.content.slice(0, 24)}」做了简短交流。`,
  }));
}

function fallbackFeedback(note: Note): SessionFeedback {
  const moodLabel = MOOD_LABELS[note.mood] ?? "平稳";
  const ranked = rankMentorsForFeedback(note);
  const mentorHint = ranked[0]?.mentorName;
  return {
    timeRange: buildSessionTimeRange(note),
    moodLabel,
    moodSource: "user",
    talkSummaries: fallbackTalkSummaries(note),
    suggestions: [
      "今天只做一件很小的事：给此刻的感受起一个名字，并留意它在身体里的位置。",
      mentorHint
        ? `若还想继续，可以再回到${mentorHint}身边，把刚才没说完的一句补上。`
        : "若还想继续，可以明天再写下此刻多出来的一点点感觉。",
    ],
    xiaoyuNote: defaultXiaoyuNote(moodLabel),
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
  const endedAt = new Date().toISOString();
  const timeRange = buildSessionTimeRange(note, endedAt);
  const userMood = MOOD_LABELS[note.mood] ?? "平稳";
  const ranked = rankMentorsForFeedback(note);

  if (!isLLMConfigured()) return { ...fallbackFeedback(note), timeRange, createdAt: endedAt };

  try {
    const mentorBlocks = ranked
      .map(
        (item, index) =>
          `【导师${index + 1}｜${item.mentorName}|${item.school}|体量${item.volume}】\n${item.transcript.slice(0, 1800)}`
      )
      .join("\n\n");

    const raw = await chatCompletion(
      [
        {
          role: "system",
          content:
            "你是小愈，负责在心理陪伴圆桌结束后生成温和、具体、非诊断性的反馈单。只输出严格 JSON，不要 markdown。",
        },
        {
          role: "user",
          content: `用户便签：${note.content}
用户进入时选择的心情：${userMood}
画像议题：${profile?.coreIssues.join("、") || "暂无"}

本轮仅包含用户实际谈心（或焦点）导师，材料如下（请严格按这些条目生成谈话总结，不要扩成全部四位）：
${mentorBlocks || "（仅有便签，尚无导师深聊）"}

请输出 JSON：
{
  "moodLabel": "2-6字心情标签；可沿用用户心情，也可据对话微调（如低落/疲惫/平稳/不错/晴朗/忐忑/释然等）",
  "moodSource": "user 或 ai；若基本沿用用户心情用 user，若明显据对话重判用 ai",
  "talkSummaries": [
    {"school":"与材料一致的 school id","summary":"80-140字：概括用户主要问题/倾诉 + 该导师回应要点"}
  ],
  "suggestions": ["导师建议1","导师建议2","导师建议3"],
  "xiaoyuNote": "一句小愈说的话，针对 moodLabel 温柔开导，不超过40字"
}

要求：talkSummaries 条数必须与给定导师材料一致，不要新增未出现的导师；若材料导师名为「圆桌」，school 仍用给定 id，summary 写成一次圆桌总览；suggestions 2-4条，可执行、非说教；不做诊断。`,
        },
      ],
      { temperature: 0.5, maxTokens: 900 }
    );

    const parsed = JSON.parse(extractJson(raw)) as {
      moodLabel?: string;
      moodSource?: string;
      talkSummaries?: { school?: string; summary?: string }[];
      suggestions?: string[];
      xiaoyuNote?: string;
    };

    const bySchool = new Map(
      (parsed.talkSummaries ?? [])
        .filter((item) => item.school && item.summary)
        .map((item) => [item.school as string, String(item.summary).trim()])
    );

    const talkSummaries: MentorTalkSummary[] = ranked.map((item) => ({
      school: item.school,
      mentorName: item.mentorName,
      volume: item.volume,
      summary:
        bySchool.get(item.school) ||
        `围绕便签内容，与${item.mentorName}做了交流；细节可回看原对话。`,
    }));

    if (talkSummaries.length === 0) {
      talkSummaries.push({
        school: "humanistic",
        mentorName: "小愈",
        volume: volumeOf(note.content),
        summary: `你写下了：「${note.content.slice(0, 60)}${note.content.length > 60 ? "…" : ""}」。圆桌还没展开深聊，但记录本身已经是一次停顿。`,
      });
    }

    const suggestions = (parsed.suggestions ?? [])
      .map((item) => String(item).trim())
      .filter(Boolean)
      .slice(0, 4);
    const moodLabel = String(parsed.moodLabel || userMood).trim().slice(0, 8) || userMood;
    const moodSource: "user" | "ai" =
      parsed.moodSource === "ai" || (parsed.moodLabel && parsed.moodLabel !== userMood) ? "ai" : "user";

    if (suggestions.length === 0 || !parsed.xiaoyuNote) {
      throw new Error("invalid feedback shape");
    }

    return {
      timeRange,
      moodLabel,
      moodSource,
      talkSummaries,
      suggestions,
      xiaoyuNote: String(parsed.xiaoyuNote).trim().slice(0, 80),
      createdAt: endedAt,
    };
  } catch (error) {
    console.error("[feedback] fallback", error);
    return { ...fallbackFeedback(note), timeRange, createdAt: endedAt };
  }
}
