import type { SchoolId } from "@/lib/types";

export type MentorFeature = "freud" | "rogers" | "bandura" | "skinner";

export type MentorDisplay = {
  name: string;
  school: string;
  description: string;
  feature: MentorFeature;
  mark: string;
};

/** 落地页与主界面共用的四位导师展示信息 */
export const MENTOR_DISPLAY: Record<SchoolId, MentorDisplay> = {
  psychodynamic: {
    name: "西格蒙德·弗洛伊德",
    school: "精神分析",
    description: "强调童年性本能与无意识冲突，人格由本我、自我、超我构成。",
    feature: "freud",
    mark: "暖",
  },
  humanistic: {
    name: "卡尔·罗杰斯",
    school: "人本主义",
    description: "坚信人的“自我实现”倾向，主张以无条件的积极关注和共情来促进来访者成长。",
    feature: "rogers",
    mark: "镜",
  },
  cognitive: {
    name: "阿尔伯特·班杜拉",
    school: "社会认知理论",
    description: "在行为主义基础上加入认知因素，提出“观察学习”和“自我效能感”，强调人与环境的交互作用。",
    feature: "bandura",
    mark: "思",
  },
  postmodern: {
    name: "B.F. 斯金纳",
    school: "行为主义",
    description: "只研究可观察行为，认为一切心理都是环境刺激与操作性条件反射的产物。",
    feature: "skinner",
    mark: "叙",
  },
};
