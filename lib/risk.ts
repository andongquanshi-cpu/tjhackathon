import type { Profile, RiskSignal } from "./types";

const CRISIS = [
  "不想活",
  "想死",
  "自杀",
  "结束生命",
  "伤害自己",
  "伤害别人",
  "活着没意思",
];

const CONCERN = [
  "每天都睡不着",
  "完全吃不下",
  "控制不住",
  "崩溃",
  "绝望",
  "喘不过气",
  "没人能帮我",
  "持续失眠",
];

const GENTLE = ["很累", "焦虑", "难过", "孤独", "压力大", "不开心", "害怕", "内耗"];

const contains = (text: string, words: string[]) => words.some((word) => text.includes(word));

export function evaluateRisk(content: string, profile: Profile | null): RiskSignal | null {
  const normalized = content.replace(/\s+/g, "");
  if (contains(normalized, CRISIS)) {
    return {
      level: "crisis",
      title: "现在，请先不要独自承受",
      message:
        "你写下的内容让我们担心你此刻的安全。小愈不是医生，也无法替代紧急帮助。请尽快联系一位可信任的人，并联系专业援助；如果危险正在发生，请立即拨打 120 或 110。",
      resources: ["全国统一心理援助热线：12356", "北京心理危机干预中心：010-82951332"],
    };
  }

  const lowDimensions =
    profile &&
    Object.values(profile.dimensions).filter((score) => score <= 25).length >= 2;
  if (contains(normalized, CONCERN) || lowDimensions) {
    return {
      level: "concern",
      title: "小愈想多陪你停一会儿",
      message:
        "这些感受似乎已经明显影响到你的生活。圆桌可以提供不同视角，但不代替专业评估。建议你把近况告诉可信任的人，并考虑预约专业心理咨询或医疗支持。",
      resources: ["如感到自己或他人可能处于危险中，请立即拨打 120 或 110"],
    };
  }

  if (contains(normalized, GENTLE)) {
    return {
      level: "gentle",
      title: "先照顾此刻的自己",
      message: "我听见你正在经历不容易的感受。进入圆桌前，可以先做一次缓慢呼吸；你也可以随时停止，不必把所有事情一次说完。",
    };
  }
  return null;
}
