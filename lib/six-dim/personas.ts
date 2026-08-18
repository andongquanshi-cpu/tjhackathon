import type { CoreAxis, DriveAxis, EmotionAxis } from "./meta";

export interface Persona12 {
  id: number;
  name: string;
  tagline: string;
  core: CoreAxis;
  drive: DriveAxis;
  emotion: EmotionAxis;
  /** public 下的小人图路径 */
  image: string;
}

/** V4：12 型人格，严格按文档录入 */
export const PERSONA_12: Persona12[] = [
  { id: 1, name: "明星", tagline: "自己信自己，想到就干，热情全写脸上", core: "自稳", drive: "冲锋", emotion: "炽热", image: "/personas/star.png" },
  { id: 2, name: "老板", tagline: "不声不响，事儿全办成了", core: "自稳", drive: "冲锋", emotion: "温和", image: "/personas/boss.png" },
  { id: 3, name: "孤独的狼", tagline: "一个人就是一支队伍", core: "自稳", drive: "冲锋", emotion: "冷静", image: "/personas/lone-wolf.png" },
  { id: 4, name: "演讲家", tagline: "想得明白，讲得精彩", core: "自稳", drive: "运筹", emotion: "炽热", image: "/personas/speaker.png" },
  { id: 5, name: "观察者", tagline: "心里有数，嘴上随缘", core: "自稳", drive: "运筹", emotion: "温和", image: "/personas/observer.png" },
  { id: 6, name: "思考者", tagline: "脑内千军万马，表面一动不动", core: "自稳", drive: "运筹", emotion: "冷静", image: "/personas/thinker.png" },
  { id: 7, name: "勇追梦", tagline: "为爱和掌声冲锋陷阵", core: "外求", drive: "冲锋", emotion: "炽热", image: "/personas/dreamer.png" },
  { id: 8, name: "老好人", tagline: "你一开口，我就已经在路上", core: "外求", drive: "冲锋", emotion: "温和", image: "/personas/people-pleaser.png" },
  { id: 9, name: "宝剑哥", tagline: "不说，但一直在做", core: "外求", drive: "冲锋", emotion: "冷静", image: "/personas/sword.png" },
  { id: 10, name: "小戏精", tagline: "内心戏超多，还特别想被夸", core: "外求", drive: "运筹", emotion: "炽热", image: "/personas/drama.png" },
  { id: 11, name: "纠结者", tagline: "想了八季，等你喊开机", core: "外求", drive: "运筹", emotion: "温和", image: "/personas/overthinker.png" },
  { id: 12, name: "小蘑菇", tagline: "想被看见，又不敢举手", core: "外求", drive: "运筹", emotion: "冷静", image: "/personas/mushroom.png" },
];

export function getPersona12(core: CoreAxis, drive: DriveAxis, emotion: EmotionAxis): Persona12 {
  return (
    PERSONA_12.find((item) => item.core === core && item.drive === drive && item.emotion === emotion) ??
    PERSONA_12[11]
  );
}

export function getPersonaById(id: number | undefined | null): Persona12 | undefined {
  if (!id) return undefined;
  return PERSONA_12.find((item) => item.id === id);
}

export function personaImageSrc(id: number | undefined | null, name?: string | null): string | null {
  const byId = getPersonaById(id);
  if (byId) return byId.image;
  if (name) {
    const byName = PERSONA_12.find((item) => item.name === name);
    if (byName) return byName.image;
  }
  return null;
}
