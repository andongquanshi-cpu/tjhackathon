/** 21 天每日便签引导语 */
export const DAY_PROMPTS: string[] = [
  "今天，身体里最明显的感受是什么？",
  "记录一件今天让你分心的小事。",
  "此刻的情绪像什么天气？给今天打个标签。",
  "今天有没有「自动化」的时刻——没注意到自己在做什么？",
  "写下一个今天出现的念头，先不评判它。",
  "今天谁的一句话让你有触动？",
  "观察一次完整的呼吸，然后写下感受。",
  "今天你对自己说了什么？如果换成对朋友说，会怎么说？",
  "记录一件小小的「做到了」的事。",
  "今天有没有想逃避的事？它是什么感觉？",
  "写下今天让你感到温暖的一个瞬间。",
  "今天你的身体在哪个部位最紧绷？",
  "如果今天的压力有形状，它长什么样？",
  "记录一个你感谢的人或事。",
  "今天有没有「应该」在绑架你？",
  "写下你此刻最想被理解的一件事。",
  "今天你注意到别人身上的什么优点？",
  "有什么事情你一直推迟？写下第一步。",
  "今天睡得怎么样？身体想要什么？",
  "回顾这段旅程，你发现自己有了什么变化？",
  "给 21 天后的自己留一句话。",
];

export interface DailyGuide {
  day: number;
  theme: string;
  subtitle: string;
  tasks: {
    id: string;
    part: string;
    title: string;
    description: string;
    duration: string;
    hint?: string;
  }[];
}

const THEMES = [
  ["抵达此刻", "先注意，再开始"],
  ["看见分心", "不责备走神的自己"],
  ["命名天气", "为情绪留一个位置"],
  ["放慢动作", "从自动驾驶中醒来"],
  ["念头不是事实", "把想法放在手心里看"],
  ["听见关系", "留意一句话如何进入心里"],
  ["一呼一吸", "回到身体最简单的锚点"],
  ["对自己温柔", "换一种说话的方式"],
  ["收集微小做到", "让力量有迹可循"],
  ["靠近回避", "只看一眼，不必解决"],
  ["保存温暖", "让好事多停留十秒"],
  ["身体地图", "紧绷也在传递消息"],
  ["压力的形状", "把无形变得可观察"],
  ["练习感谢", "注意已经拥有的支持"],
  ["松开应该", "分辨规则与真实需要"],
  ["被理解的愿望", "说出最想被听见的部分"],
  ["发现他人", "连接从注意开始"],
  ["最小的一步", "行动不必一次完成"],
  ["听身体说", "恢复也是训练的一部分"],
  ["回望变化", "看见过程，而非成绩"],
  ["写给未来", "把此刻交给之后的自己"],
] as const;

export const DAILY_GUIDES: DailyGuide[] = DAY_PROMPTS.map((prompt, index) => {
  const day = index + 1;
  const [theme, subtitle] = THEMES[index];
  return {
    day,
    theme,
    subtitle,
    tasks: [
      {
        id: `day-${day}-record`,
        part: "PART 1",
        title: "记录与标记",
        description: prompt,
        duration: "约 3 分钟",
        hint: "点文字去写下一句；圆点用来勾选完成",
      },
      {
        id: `day-${day}-practice`,
        part: "PART 2",
        title: "今日微练习 · 正念",
        description: `带着「${theme}」做一段短冥想：停下来观察十秒，不评价，也不急着改变。`,
        duration: "约 3 分钟",
        hint: "点文字进入正念冥想",
      },
      {
        id: `day-${day}-body`,
        part: "PART 3",
        title: "身体觉察 · 呼吸",
        description: "把注意力放到呼吸上，跟着节奏慢慢松开身体里最紧的地方。",
        duration: "约 2 分钟",
        hint: "点文字进入呼吸练习",
      },
    ],
  };
});

export function dayPrompt(day: number): string {
  const idx = Math.max(0, Math.min(DAY_PROMPTS.length - 1, day - 1));
  return DAY_PROMPTS[idx];
}

export function dailyGuide(day: number): DailyGuide {
  const index = Math.max(0, Math.min(DAILY_GUIDES.length - 1, day - 1));
  return DAILY_GUIDES[index];
}