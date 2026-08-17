import { evaluateRisk } from "./risk";
import type { ChatMessage, Profile, RiskSignal } from "./types";

export type SafetyLevel = "S0" | "S1" | "S2" | "S3";

export interface InputAnalysis {
  rawInput: string;
  resolvedInput: string;
  safetyLevel: SafetyLevel;
  intents: string[];
  topics: string[];
  needsClarification: boolean;
  needsPause: boolean;
}

const TOPIC_RULES: Array<[string, RegExp]> = [
  ["家庭关系", /父母|爸爸|妈妈|家人|家庭|亲戚/],
  ["友情与亲密关系", /朋友|恋爱|伴侣|对象|前任|分手|关系|喜欢的人/],
  ["学业与职业", /学习|考试|作业|论文|学校|大学|工作|求职|上班|职业/],
  ["自我价值", /没用|失败|不行|自卑|价值|完美|讨厌自己|责怪自己/],
  ["压力与焦虑", /焦虑|压力|紧张|担心|害怕|恐惧|喘不过气/],
  ["低落与孤独", /难过|低落|抑郁|绝望|孤独|空心|没意义/],
  ["睡眠与身体", /失眠|睡不着|熬夜|身体|心跳|头痛|疲惫|很累/],
  ["行动困难", /拖延|手机|行动不起来|坚持不了|放弃|没动力/],
  ["边界与表达", /拒绝|边界|不敢说|表达|需求|讨好|冲突/],
];

function safetyFromRisk(risk: RiskSignal | null): SafetyLevel {
  if (!risk) return "S0";
  if (risk.level === "crisis") return "S3";
  if (risk.level === "concern") return "S2";
  return "S1";
}

function detectIntents(input: string): string[] {
  const intents: string[] = [];
  if (/为什么|原因|怎么回事|分析|理解/.test(input)) intents.push("understand");
  if (/怎么办|建议|怎么做|方法|帮帮我/.test(input)) intents.push("advice");
  if (/是什么|科普|区别|知识|解释一下/.test(input)) intents.push("psychoeducation");
  if (/选择|要不要|该不该|决定/.test(input)) intents.push("decision");
  if (/陪我|听我说|吐槽|难受|委屈|好累/.test(input)) intents.push("emotional_support");
  return intents.length ? intents : ["explore"];
}

export function analyzeInput(opts: {
  input: string;
  noteContent?: string;
  history?: ChatMessage[];
  profile: Profile | null;
  storedRisk?: RiskSignal | null;
}): InputAnalysis {
  const rawInput = opts.input.trim();
  const needsPause = /(?:我)?(?:好|太|很)?累(?:了|死了)?|疲惫|撑不住|不想继续(?:说|聊)?|不想说了|先停(?:一下)?|想休息/.test(rawInput);
  const recentHistory = (opts.history ?? [])
    .slice(-4)
    .map((message) => `${message.role === "user" ? "用户" : "导师"}：${message.content}`)
    .join("\n");
  const short = rawInput.length <= 8;
  const context = [opts.noteContent, recentHistory].filter(Boolean).join("\n");
  const resolvedInput = short && context
    ? `当前短输入：${rawInput}\n相关上下文：${context}`
    : rawInput;
  const detectedRisk = evaluateRisk(resolvedInput, opts.profile);
  const rank = { gentle: 1, concern: 2, crisis: 3 } as const;
  const risk =
    opts.storedRisk && (!detectedRisk || rank[opts.storedRisk.level] >= rank[detectedRisk.level])
      ? opts.storedRisk
      : detectedRisk;
  const topics = TOPIC_RULES.filter(([, pattern]) => pattern.test(resolvedInput)).map(([topic]) => topic);

  return {
    rawInput,
    resolvedInput,
    safetyLevel: safetyFromRisk(risk),
    intents: detectIntents(resolvedInput),
    topics: topics.length ? topics : ["一般心理困扰"],
    needsClarification: short && !context && !/不想活|自杀|自伤|伤害/.test(rawInput),
    needsPause,
  };
}
