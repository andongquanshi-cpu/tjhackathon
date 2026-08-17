export type SixDimKey =
  | "agency"
  | "attachment"
  | "defense"
  | "action"
  | "processing"
  | "decision";

export type QuestionKind = "scenario" | "likert";

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
  /** 情景题选项 */
  options?: ScenarioOption[];
  /** Likert 反向计分 */
  reverse?: boolean;
}

export const SIX_DIM_META: {
  key: SixDimKey;
  label: string;
  short: string;
  color: string;
  group: "self" | "action" | "cognition";
  groupLabel: string;
  letterA: string;
  letterB: string;
  poleA: string;
  poleB: string;
  blurbA: string;
  blurbB: string;
  hint: string;
}[] = [
  {
    key: "agency",
    label: "主体定位",
    short: "D1",
    color: "#c45c3e",
    group: "self",
    groupLabel: "自我模型",
    letterA: "A",
    letterB: "F",
    poleA: "内部主体",
    poleB: "外部附庸",
    blurbA: "自带导航系统，不需要别人告诉你往哪走。",
    blurbB: "GPS 交给外界了，别人说往左你就不往右。",
    hint: "你的自我评价标准是内生的还是外引的？",
  },
  {
    key: "attachment",
    label: "依恋安全",
    short: "D2",
    color: "#3d7ea6",
    group: "self",
    groupLabel: "自我模型",
    letterA: "S",
    letterB: "N",
    poleA: "安全信任",
    poleB: "依赖恐惧",
    blurbA: "朋友三小时不回消息？人可能在忙，你可能在睡觉。",
    blurbB: "对方已读不回 = 脑内灾难片首映。",
    hint: "亲密关系中你安然自处还是时刻警觉被抛弃？",
  },
  {
    key: "defense",
    label: "防御倾向",
    short: "D3",
    color: "#6b8f71",
    group: "action",
    groupLabel: "行动模型",
    letterA: "O",
    letterB: "W",
    poleA: "开放卷入",
    poleB: "情绪隔离",
    blurbA: "哭就哭，笑就笑，情绪不是bug是feature。",
    blurbB: "铠甲24小时在线，连哭都要先预约。",
    hint: "面对脆弱时你敢真实流露还是戴上铠甲硬扛？",
  },
  {
    key: "action",
    label: "行动模式",
    short: "D4",
    color: "#b0892e",
    group: "action",
    groupLabel: "行动模型",
    letterA: "G",
    letterB: "P",
    poleA: "现实落地",
    poleB: "精神内耗",
    blurbA: "拆成第一件小事就开干，边做边想。",
    blurbB: "想了一万遍怎么开始，结果还是没开始。",
    hint: "面对复杂任务你先动手还是先在脑子里空转？",
  },
  {
    key: "processing",
    label: "信息加工",
    short: "D5",
    color: "#7a6bb0",
    group: "cognition",
    groupLabel: "认知模型",
    letterA: "R",
    letterB: "V",
    poleA: "体验感官",
    poleB: "概念直觉",
    blurbA: "数据、细节、流程——看得见摸得着的才踏实。",
    blurbB: "脑洞、理论、未来——看不见的才性感。",
    hint: "你天然关注细节现实还是被抽象脑洞吸引？",
  },
  {
    key: "decision",
    label: "决策驱动",
    short: "D6",
    color: "#8b5a4a",
    group: "cognition",
    groupLabel: "认知模型",
    letterA: "L",
    letterB: "H",
    poleA: "逻辑结构",
    poleB: "价值情感",
    blurbA: "对事不对人，规则面前六亲不认。",
    blurbB: "对人不对事，大家的感受比效率重要。",
    hint: "做决定时你优先逻辑效率还是人的感受？",
  },
];

export const LIKERT_LABELS = [
  { v: 1, label: "非常不同意" },
  { v: 2, label: "比较不同意" },
  { v: 3, label: "中立" },
  { v: 4, label: "比较同意" },
  { v: 5, label: "非常同意" },
] as const;

/** 阈值：>=12 极性 A，<12 极性 B */
export const SIX_DIM_THRESHOLD = 12;
export const SIX_DIM_MAX = 20;
export const SIX_DIM_MIN = 4;
