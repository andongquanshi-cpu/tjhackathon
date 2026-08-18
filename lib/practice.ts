export type PracticeId = "meditation" | "woodfish" | "breathing" | "classroom";

export type GuideAction =
  | { kind: "compose"; label: string }
  | { kind: "practice"; practiceId: PracticeId; href: string; label: string }
  | { kind: "soon"; label: string };

export const FEATURE_MODULES = [
  {
    id: "meditation" as const,
    eyebrow: "MINDFULNESS",
    title: "正念冥想",
    description: "把注意力轻轻带回当下。",
    href: "/practice/meditation",
    available: true,
  },
  {
    id: "woodfish" as const,
    eyebrow: "GENTLE WISH",
    title: "木鱼祈愿",
    description: "跟随缓慢节奏，放下一份心愿。",
    href: "/practice/woodfish",
    available: true,
  },
  {
    id: "breathing" as const,
    eyebrow: "BREATHE",
    title: "呼吸练习",
    description: "用几次呼吸，让身体慢慢松开。",
    href: "/practice/breathing",
    available: true,
  },
  {
    id: "classroom" as const,
    eyebrow: "MICRO CLASS",
    title: "心理微课堂",
    description: "轻量小知识，理解情绪与关系。",
    href: "/practice/classroom",
    available: false,
  },
] as const;

/** 纸卷三条任务 → 引导去向 */
export function guideTaskAction(taskId: string): GuideAction {
  if (taskId.endsWith("-record")) {
    return { kind: "compose", label: "去记下这一刻" };
  }
  if (taskId.endsWith("-practice")) {
    return {
      kind: "practice",
      practiceId: "meditation",
      href: "/practice/meditation",
      label: "去做正念冥想",
    };
  }
  if (taskId.endsWith("-body")) {
    return {
      kind: "practice",
      practiceId: "breathing",
      href: "/practice/breathing",
      label: "去做呼吸练习",
    };
  }
  return { kind: "soon", label: "即将开放" };
}

export function practiceHref(practiceId: PracticeId, day: number, taskId?: string) {
  const base = FEATURE_MODULES.find((item) => item.id === practiceId)?.href ?? `/practice/${practiceId}`;
  const params = new URLSearchParams({ day: String(day), from: "journal" });
  if (taskId) params.set("task", taskId);
  return `${base}?${params.toString()}`;
}
