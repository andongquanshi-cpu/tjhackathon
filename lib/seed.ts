import { dayPrompt } from "./prompts";
import type { Note, Profile } from "./types";

const iso = (offsetMs: number) => new Date(Date.now() - offsetMs).toISOString();

/**
 * 演示种子数据：只给便签与画像，AI 内容（四流派评论/对话）全部由真实 LLM 生成，
 * 不预置任何 mock 回复。
 */
export function buildSeedData(): { notes: Note[]; profile: Profile } {
  const profile: Profile = {
    createdAt: iso(3 * 86_400_000),
    updatedAt: iso(1 * 86_400_000),
    sixDim: {
      scores: {
        agency: 14,
        attachment: 11,
        defense: 13,
        action: 10,
        processing: 15,
        decision: 12,
      },
      bits: "101011",
      letterCode: "ANW GRL",
      personaName: "孤狼实干家",
      personaTagline: "独立、能干、理性，但不太敢信任别人也不太敢展露脆弱——铠甲下你也值得被温柔对待。",
      assessedAt: iso(3 * 86_400_000),
      report: "独立、能干、理性，但不太敢信任别人也不太敢展露脆弱——铠甲下你也值得被温柔对待。",
    },
    coreIssues: ["工作边界模糊", "习惯性自我批评"],
    cognitivePatterns: ["灾难化", "非黑即白"],
    strengths: ["有觉察意愿", "愿意记录"],
    timeline: [
      "完成六维测评：孤狼实干家（ANW GRL）",
      "Day 1：写下便签",
      "Day 2：写下便签",
    ],
  };

  const mkNote = (
    id: string,
    day: number,
    content: string,
    mood: number,
    offsetMs: number
  ): Note => ({
    id,
    day,
    prompt: dayPrompt(day),
    content,
    mood,
    createdAt: iso(offsetMs),
    comments: null,
    conversations: {},
  });

  const notes: Note[] = [
    mkNote(
      "seed-1",
      1,
      "今天加班到11点，回家路上觉得自己像一台机器，很累但好像也停不下来。",
      2,
      2 * 86_400_000
    ),
    mkNote(
      "seed-2",
      2,
      "中午去楼下晒了十分钟太阳，风很轻，突然觉得「活着」也挺好的。",
      4,
      1 * 86_400_000 + 3 * 3_600_000
    ),
    mkNote("seed-3", 2, "朋友说我想太多了，我知道他是好意，但还是有点难过，好像不被理解。", 3, 1 * 86_400_000),
  ];

  return { notes, profile };
}
