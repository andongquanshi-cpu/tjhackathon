export type MoodOption = {
  value: number;
  mark: string;
  label: string;
  /** 天气意象 */
  weather: string;
  icon: string;
};

/** 便签弹窗心情天气：1 阴 → 5 晴 */
export const MOOD_OPTIONS: MoodOption[] = [
  {
    value: 1,
    mark: "阴",
    label: "低落",
    weather: "阴雨",
    icon: "/moods/yin.png",
  },
  {
    value: 2,
    mark: "倦",
    label: "疲惫",
    weather: "灰雾",
    icon: "/moods/juan.png",
  },
  {
    value: 3,
    mark: "平",
    label: "平稳",
    weather: "多云",
    icon: "/moods/ping.png",
  },
  {
    value: 4,
    mark: "暖",
    label: "不错",
    weather: "暖阳",
    icon: "/moods/nuan.png",
  },
  {
    value: 5,
    mark: "晴",
    label: "晴朗",
    weather: "放晴",
    icon: "/moods/qing.png",
  },
];

export const MOOD_MARKS: Record<number, string> = Object.fromEntries(
  MOOD_OPTIONS.map((item) => [item.value, item.mark])
) as Record<number, string>;

export function getMoodOption(value: number): MoodOption {
  return MOOD_OPTIONS.find((item) => item.value === value) ?? MOOD_OPTIONS[2];
}
