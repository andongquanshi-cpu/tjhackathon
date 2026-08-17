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

export interface SixDimProfile {
  /** 各维 4-20 分 */
  scores: Record<SixDimKey, number>;
  /** 6 位二进制，如 111011 */
  bits: string;
  /** 字母代码，如 ASO PRL */
  letterCode: string;
  personaName: string;
  personaTagline: string;
  assessedAt: string;
  answers?: Record<string, number>;
  /** AI / 模板报告正文 */
  report?: string;
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

export interface SessionFeedback {
  summary: string;
  highlights: string[];
  suggestedAction: string;
  createdAt: string;
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