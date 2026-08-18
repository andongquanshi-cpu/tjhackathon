import type { SchoolId } from "@/lib/types";

export type MentorFeature = "freud" | "rogers" | "bandura" | "skinner";

export type MentorDisplay = {
  name: string;
  englishName: string;
  school: string;
  /** 短描述（备用） */
  description: string;
  /** 主界面气泡：第一人称自我介绍 */
  intro: string;
  /** 名字下方关键词标签 */
  keywords: string[];
  /** 对话页介绍卡文案（设计稿） */
  cardLead: string;
  cardBody: string;
  feature: MentorFeature;
  mark: string;
};

/** 落地页与主界面共用的四位导师展示信息 */
export const MENTOR_DISPLAY: Record<SchoolId, MentorDisplay> = {
  psychodynamic: {
    name: "西格蒙德·弗洛伊德",
    englishName: "Sigmund Freud",
    school: "精神分析",
    description: "强调童年性本能与无意识冲突，人格由本我、自我、超我构成。",
    intro:
      "你好，我是弗洛伊德。别紧张，我不会立刻给你贴标签——我更想听的是那些你嘴上没说、夜里却反复出现的念头。我的理论核心是潜意识：本我、自我、超我在台下较劲时，症状往往只是台面上的影子。经典个案里，我爱追梦、口误、童年关系，因为它们常常比“我今天心情不好”更诚实。和我聊时，我会慢一点、深一点，偶尔问得有点刁钻；如果你愿意，我们一起把藏在暗处的那一角轻轻掀开。",
    keywords: ["自我剖析", "潜意识", "情感探秘"],
    cardLead: "精神分析学派创始人，关注潜意识下的“本我”。",
    cardBody: "他会深入分析你的思想和情绪，找出存在于你潜意识里的黑暗一面。",
    feature: "freud",
    mark: "暖",
  },
  humanistic: {
    name: "卡尔·罗杰斯",
    englishName: "Carl Ransom Rogers",
    school: "人本主义",
    description: "坚信人的“自我实现”倾向，主张以无条件的积极关注和共情来促进来访者成长。",
    intro:
      "我是罗杰斯。我不太急着“修好”你，我更相信：当你被真正听见，成长会自己发芽。人本主义里，我最在意共情、真诚，和无条件的积极关注——听起来像口号，落地时却是：先接住你的感受，再一起看你想往哪走。典型情境是自我怀疑、人际委屈、想被理解却找不到词的时候。和我说话，你会发现我常常复述、确认、陪你停一下；少评判、少说教，多一点“我在这儿”。",
    keywords: ["无条件积极关注", "安慰", "鼓励"],
    cardLead: "人本主义创始人，坚持共情、陪伴、无条件积极关注。",
    cardBody: "在一句句温暖的安慰及鼓励中，让你的每个小情绪，都被稳稳地接住。",
    feature: "rogers",
    mark: "镜",
  },
  cognitive: {
    name: "阿尔伯特·班杜拉",
    englishName: "Albert Bandura",
    school: "社会认知理论",
    description:
      "关注你如何看待自己与世界：自我效能、观察学习与社会认知，帮助你重建信心、更清楚地认识自己。",
    intro:
      "我是班杜拉。如果你以为我会只盯着“行为怎么改”，那就偏了——我真正关心的是：你怎么看待自己，又信不信自己能做成一件事。社会认知理论讲的是：观察学习、自我效能感，以及你对自我与世界的理解方式。很多时候卡住的不是能力不够，而是心里那句“我大概不行”。和我聊，我们会一起重新认识一段经历、找成功的小证据，把自我认知一点点理清楚——不是空喊加油，而是帮你把自信心长回来，看见自己其实可以。",
    keywords: ["自我效能", "认识自我", "正向力量"],
    cardLead: "社会认知理论代表人物，强调自我效能与积极自我认识。",
    cardBody: "他会陪你重新看待经历与自己，找回“我能做成”的信心，让自我认知更清晰、更有力量。",
    feature: "bandura",
    mark: "思",
  },
  postmodern: {
    name: "B.F. 斯金纳",
    englishName: "B.F. Skinner",
    school: "行为主义",
    description: "只研究可观察行为，认为习惯与改变来自环境反馈与操作性强化，不空谈“想通了”。",
    intro:
      "我是斯金纳。抱歉，我可能不会先问“你内心深处的宇宙是什么颜色”——我会先问：这件事前后，你具体做了什么、环境给了你什么反馈？行为主义看重可观察行为与强化：奖励、回避、习惯回路，往往比空谈意志力更管用。核心情境像拖延、焦虑回避、想改却改不动的小循环。和我对话会比较清爽：拆步骤、设小奖励、调环境，少一点玄学，多一点“下次你可以试试这个”。听起来冷？其实是想帮你把难事变小、变可做。",
    keywords: ["行动派", "实操指南", "解决方法"],
    cardLead: "行为主义代表人物，主要研究可观察的行为。",
    cardBody: "他会从事件本身出发帮你分析，给出你一些可实施的建议和应对情绪的方法。",
    feature: "skinner",
    mark: "叙",
  },
};

export function getMentorByFeature(feature: MentorFeature): MentorDisplay {
  const entry = Object.values(MENTOR_DISPLAY).find((item) => item.feature === feature);
  if (!entry) throw new Error(`Unknown mentor feature: ${feature}`);
  return entry;
}
