export type SixDimKey =
  | "agency"
  | "attachment"
  | "defense"
  | "action"
  | "processing"
  | "decision";

export type QuestionKind = "scenario" | "likert";

export type CoreAxis = "自稳" | "外求";
export type DriveAxis = "冲锋" | "运筹";
export type EmotionAxis = "炽热" | "温和" | "冷静";

export interface ScenarioOption {
  key: "A" | "B" | "C" | "D" | "E";
  text: string;
  score: number;
}

export interface SixDimQuestion {
  id: string;
  index: number;
  dim: SixDimKey;
  kind: QuestionKind;
  text: string;
  options?: ScenarioOption[];
  reverse?: boolean;
}

export const SIX_DIM_META: {
  key: SixDimKey;
  label: string;
  short: string;
  color: string;
  group: "self" | "action" | "cognition";
  groupLabel: string;
  poleA: string;
  poleB: string;
  blurbA: string;
  blurbB: string;
  hint: string;
}[] = [
  {
    key: "agency",
    label: "自我认同",
    short: "D1",
    color: "#c45c3e",
    group: "self",
    groupLabel: "自我模型",
    poleA: "自我认同型",
    poleB: "他人认同型",
    blurbA: "对自己的价值有内在确认，不太需要外界肯定来证明自己。",
    blurbB: "自我价值感更多依赖外部评价和他人认可。",
    hint: "你更靠内在确认自己，还是靠外界反馈？",
  },
  {
    key: "attachment",
    label: "依恋风格",
    short: "D2",
    color: "#3d7ea6",
    group: "self",
    groupLabel: "自我模型",
    poleA: "安全型",
    poleB: "焦虑型",
    blurbA: "在关系中感到安全，既能亲密也能独立。",
    blurbB: "在关系中容易焦虑，害怕被抛弃或不被爱。",
    hint: "亲密关系里你安稳，还是容易紧绷？",
  },
  {
    key: "defense",
    label: "情感外露",
    short: "D3",
    color: "#6b8f71",
    group: "action",
    groupLabel: "表达模型",
    poleA: "外放型",
    poleB: "内敛型",
    blurbA: "情绪自然流露，开心难过都写在脸上。",
    blurbB: "情绪内敛克制，不轻易向外展示内心状态。",
    hint: "情绪更愿意流露，还是习惯收着？",
  },
  {
    key: "action",
    label: "行动力",
    short: "D4",
    color: "#b0892e",
    group: "action",
    groupLabel: "表达模型",
    poleA: "行动派",
    poleB: "思考派",
    blurbA: "倾向于先行动再调整，执行力强。",
    blurbB: "倾向于先想清楚再行动，谋定后动。",
    hint: "你更常先动手，还是先想清楚？",
  },
  {
    key: "processing",
    label: "现实主义",
    short: "D5",
    color: "#7a6bb0",
    group: "cognition",
    groupLabel: "认知模型",
    poleA: "务实型",
    poleB: "想象型",
    blurbA: "关注实际、具体的事物，脚踏实地。",
    blurbB: "关注可能性、想象和抽象概念，思维跳跃。",
    hint: "你更贴地务实，还是爱脑洞想象？",
  },
  {
    key: "decision",
    label: "理性思考",
    short: "D6",
    color: "#8b5a4a",
    group: "cognition",
    groupLabel: "认知模型",
    poleA: "理性型",
    poleB: "感性型",
    blurbA: "做决定时以逻辑分析为主，客观冷静。",
    blurbB: "做决定时以感受和价值为主，同理心强。",
    hint: "决策更靠逻辑，还是更靠感受？",
  },
];

export const LIKERT_LABELS = [
  { v: 1, label: "非常不同意" },
  { v: 2, label: "比较不同意" },
  { v: 3, label: "中立" },
  { v: 4, label: "比较同意" },
  { v: 5, label: "非常同意" },
] as const;

export const SIX_DIM_THRESHOLD = 12;
export const SIX_DIM_MAX = 20;
export const SIX_DIM_MIN = 4;
