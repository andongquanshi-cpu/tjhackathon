/** 四个心理学流派的标识 */
export type SchoolId =
  | "humanistic"
  | "psychodynamic"
  | "cognitive"
  | "postmodern";

/** 画像维度 */
export type DimKey =
  | "emotion"
  | "stress"
  | "selfCare"
  | "connection"
  | "mindfulness";

export interface SchoolComment {
  school: SchoolId;
  text: string;
  createdAt: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  school: SchoolId;
  content: string;
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
}

export interface Profile {
  createdAt: string;
  updatedAt: string;
  /** 0-100 */
  dimensions: Record<DimKey, number>;
  coreIssues: string[];
  cognitivePatterns: string[];
  strengths: string[];
  timeline: string[];
}

export interface DB {
  version: 1;
  profile: Profile | null;
  notes: Note[];
}