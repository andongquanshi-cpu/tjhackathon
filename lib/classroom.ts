export type ClassroomCard = {
  id: string;
  title: string;
  aka?: string;
  oneLiner: string;
  body: string;
  takeaway: string;
};

/** 通俗小卡片：每次进入随机推一张 */
export const CLASSROOM_CARDS: ClassroomCard[] = [
  {
    id: "self-efficacy",
    title: "自我效能感",
    aka: "Self-efficacy",
    oneLiner: "你信不信「我能搞定这件事」。",
    body: "班杜拉说的自我效能感，不是盲目自信，而是你对「自己能不能做成某件事」的判断。它会受四件事影响：自己做成过、看到别人做成、有人鼓励你、以及身体是否紧张。自我效能感高一点时，人更敢迈出第一步；低一点时，容易还没开始就放弃。",
    takeaway: "想提高它，别先想「一次变强」，先找一个五分钟就能做成的小证据。",
  },
  {
    id: "odyssey-years",
    title: "奥德赛时期",
    aka: "Odyssey Years",
    oneLiner: "二十来岁那几年，路线图常常还没写完。",
    body: "这个说法用来形容成年早期那一段：学历、工作、亲密关系、自我身份都在重组。外面催着你「快点定下来」，里面却还在试错。它不一定是失败，更像人生里的一段探索航程——走弯路、换方向，都很常见。",
    takeaway: "如果你正觉得「别人都定了，就我还在晃」，先记住：晃，也可能是在找真正适合的岸。",
  },
  {
    id: "id-ego-superego",
    title: "本我 · 自我 · 超我",
    aka: "Id · Ego · Superego",
    oneLiner: "心里好像住着三个声音。",
    body: "弗洛伊德用这个模型比喻心理结构：本我想立刻满足（饿了就要吃、难受就要躲）；超我像严格的老师，管对错与「应该」；自我夹在中间，负责现实可行的折中。日常冲突里，常常是「我想」和「我应该」在拉扯，自我的工作就是帮两边谈和。",
    takeaway: "下次卡住时，可以问问：此刻是谁在说话？想立刻舒服的那一个，还是要求完美的那一个？",
  },
  {
    id: "npd",
    title: "自恋型人格特质（NPD）",
    aka: "Narcissistic traits",
    oneLiner: "需要被看见、被夸，有时到了很难共情别人的程度。",
    body: "网络上说的 NPD，常被简化成「很自恋」。更准确地说，它涉及夸大自我、特别需要认可，以及共情困难等模式。重要提醒：刷到标签不等于诊断；真正的人格障碍需要专业评估。生活中更实用的，是识别关系里「是否只允许你围着对方转」。",
    takeaway: "如果你总在一段关系里感到被贬低、不被允许有边界，优先保护自己，而不是急着给对方贴标签。",
  },
  {
    id: "avoidant-attachment",
    title: "回避型依恋",
    aka: "Avoidant attachment",
    oneLiner: "靠近时会紧张，于是习惯把自己收回去。",
    body: "依恋风格描述亲密关系里的习惯反应。回避型的人往往很看重独立，一感到依赖或情绪变浓，就想拉开距离、变忙、变冷。这不一定是「不爱」，更可能是早年学会了：靠自己更安全。它可以被理解和慢慢调整，不是永久判决。",
    takeaway: "如果你发现自己「一亲密就想逃」，可以练习：先承认难受，再告诉对方「我需要一点空间，不是要离开你」。",
  },
  {
    id: "emotional-neglect",
    title: "情感漠视",
    aka: "Emotional neglect",
    oneLiner: "不是被打骂，而是感受长期没人接住。",
    body: "情感漠视常常很安静：吃饭有着落、成绩被盯着，但喜怒哀乐很少被认真问。久了，人可能变得「好像没什么感觉」，或觉得自己的需要很麻烦。它留下的痕迹，不一定是戏剧冲突，而是「我不重要」的隐隐确信。",
    takeaway: "开始练习把自己的感受说完整一句。被听见，本身就是在补上以前缺的那一块。",
  },
];

const LAST_KEY = "insideout-classroom-last-id";

export function pickClassroomCard(excludeId?: string | null): ClassroomCard {
  const pool =
    excludeId && CLASSROOM_CARDS.length > 1
      ? CLASSROOM_CARDS.filter((card) => card.id !== excludeId)
      : CLASSROOM_CARDS;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index] ?? CLASSROOM_CARDS[0];
}

export function readLastClassroomId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(LAST_KEY);
  } catch {
    return null;
  }
}

export function rememberClassroomId(id: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(LAST_KEY, id);
  } catch {
    // ignore
  }
}
