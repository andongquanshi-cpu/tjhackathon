/** 四个心理学流派的标识 */
export type SchoolId =
  | "humanistic"
  | "psychodynamic"
  | "cognitive"
  | "postmodern";

/** 画像维度（旧五维，已废弃；保留类型仅防残留引用） */
export type DimKey =
  | "emotion"
  | "stress"
  | "selfCare"
  | "connection"
  | "mindfulness";

export type SixDimKey =
  | "agency"
  | "attachment"
  | "defense"
  | "action"
  | "processing"
  | "decision";

export interface SixDimAxesProfile {
  core: { score: number; label: "自稳" | "外求" };
  drive: { score: number; label: "冲锋" | "运筹" };
  emotion: { score: number; label: "炽热" | "温和" | "冷静" };
}

export interface SixDimProfile {
  /** 各维 4-20 分 */
  scores: Record<SixDimKey, number>;
  /** V4 三根合成轴 */
  axes: SixDimAxesProfile;
  /** 12 型编号 1-12 */
  personaId: number;
  personaName: string;
  personaTagline: string;
  assessedAt: string;
  answers?: Record<string, number>;
  /** AI / 模板报告正文 */
  report?: string;
  /** 小愈深度分析（仅在详细分析页展示） */
  aiReading?: string;
  aiReadingAt?: string;
}

export interface SchoolComment {
  school: SchoolId;
  text: string;
  createdAt: string;
  agentId?: "A" | "B" | "C" | "D";
  skills?: string[];
  sources?: AgentSource[];
  degraded?: boolean;
}

export interface AgentSource {
  source: string;
  text?: string;
  metadata?: Record<string, unknown>;
}

export interface ChatMessage {
  role: "user" | "assistant";
  school: SchoolId;
  content: string;
  createdAt: string;
  agentId?: "A" | "B" | "C" | "D";
  skills?: string[];
  sources?: AgentSource[];
  degraded?: boolean;
}

export type RiskLevel = "gentle" | "concern" | "crisis";

export interface RiskSignal {
  level: RiskLevel;
  title: string;
  message: string;
  resources?: string[];
}

export interface MentorTalkSummary {
  school: SchoolId;
  mentorName: string;
  /** 含用户问题与导师回答的概括 */
  summary: string;
  /** 用于排序的对话体量（字数） */
  volume: number;
}

export interface SessionFeedback {
  /** 如：2026/08/18 14/30/05 to 15/12/33 */
  timeRange: string;
  /** 心情标签 */
  moodLabel: string;
  /** user=进入时选择；ai=根据对话归纳 */
  moodSource: "user" | "ai";
  /** 谈话内容，按对话量从多到少 */
  talkSummaries: MentorTalkSummary[];
  /** 导师建议列表 */
  suggestions: string[];
  /** 小愈的话：针对心情的开导一句 */
  xiaoyuNote: string;
  createdAt: string;
}

export function isSessionFeedbackV2(value: unknown): value is SessionFeedback {
  if (!value || typeof value !== "object") return false;
  const f = value as Partial<SessionFeedback>;
  return (
    typeof f.timeRange === "string" &&
    typeof f.moodLabel === "string" &&
    (f.moodSource === "user" || f.moodSource === "ai") &&
    Array.isArray(f.talkSummaries) &&
    Array.isArray(f.suggestions) &&
    typeof f.xiaoyuNote === "string" &&
    typeof f.createdAt === "string"
  );
}

export interface DailyGuideProgress {
  day: number;
  completedTaskIds: string[];
  completedAt?: string;
  updatedAt: string;
}

export interface LocalUser {
  displayName: string;
  createdAt: string;
}

export interface Note {
  id: string;
  /** 第几天（1-21） */
  day: number;
  /** 当天的引导语 */
  prompt?: string;
  content: string;
  /** 心情 1-5 */
  mood: number;
  createdAt: string;
  /** 四流派评论，null 表示尚未生成 */
  comments: SchoolComment[] | null;
  /** 每个流派的深聊记录 */
  conversations: Partial<Record<SchoolId, ChatMessage[]>>;
  /** 用户在圆桌中选择继续深聊的导师 */
  selectedSchool?: SchoolId;
  /** 本次记录命中的安全提示 */
  risk?: RiskSignal | null;
  /** 圆桌和深聊结束后的结构化反馈 */
  feedback?: SessionFeedback | null;
}

export interface Profile {
  createdAt: string;
  updatedAt: string;
  /** 六维测评结果：只由测评决定，圆桌深聊不改分 */
  sixDim: SixDimProfile;
  coreIssues: string[];
  cognitivePatterns: string[];
  strengths: string[];
  timeline: string[];
}

export interface DB {
  version: 1 | 2 | 3 | 4;
  profile: Profile | null;
  notes: Note[];
  guideProgress: DailyGuideProgress[];
}