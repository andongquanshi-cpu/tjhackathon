import { chatCompletion, isLLMConfigured } from "./ai";
import { profileDigest } from "./agents";
import { SIX_DIM_META } from "./six-dim";
import { XIAOYU } from "./personas";
import type { Profile } from "./types";

const AXIS_FEEL = {
  core: {
    自稳: "遇到事，你会先问问自己怎么想，不太急着找别人点头。",
    外求: "别人一句评价、一个眼神，有时会在你心里停很久。",
  },
  drive: {
    冲锋: "想到了就想动手，边做边摸索，往往比干想更让你踏实。",
    运筹: "出手前，脑子里常常已经过了好几遍；你更想先看清再迈步。",
  },
  emotion: {
    炽热: "喜怒哀乐来得快，身边人也容易看出来。",
    温和: "你有情绪，但常会留一点余地，不太把场面撑满。",
    冷静: "外面也许很稳，里面未必安静——你不一定都会说出来。",
  },
} as const;

function dimFeel(profile: Profile, key: (typeof SIX_DIM_META)[number]["key"]): string {
  const meta = SIX_DIM_META.find((d) => d.key === key)!;
  const score = profile.sixDim.scores[key];
  const blurb = score >= 12 ? meta.blurbA : meta.blurbB;
  return `**${meta.label}**（${score}/20）\n${blurb}`;
}

function mockPortraitReading(profile: Profile): string {
  const six = profile.sixDim;
  const { core, drive, emotion } = six.axes;
  const dimBlocks = SIX_DIM_META.map((d) => dimFeel(profile, d.key)).join("\n\n");
  const lows = SIX_DIM_META.filter((d) => six.scores[d.key] < 10).map((d) => d.label);
  const soft = lows[0];

  return `你好。

我看了你的六维结果。此刻你更接近「${six.personaName}」——${six.personaTagline}
这不是标签，只是一张现在的地图。

## 三轴
内核偏「${core.label}」：${AXIS_FEEL.core[core.label]}
行动偏「${drive.label}」：${AXIS_FEEL.drive[drive.label]}
情绪偏「${emotion.label}」：${AXIS_FEEL.emotion[emotion.label]}

## 六个维度
${dimBlocks}

## 我想说的
${six.report ?? "有些地方比较鲜明，有些地方收得紧一些。"}
${soft ? `\n「${soft}」这边，我不会催你改。先看见就好。` : ""}

## 接下来
不用做什么大事。写一张便签：今天哪一刻最像现在的自己，或者哪一刻你想换一下。我在。

—— 小愈`;
}

const XIAOYU_READING_SYSTEM = `${XIAOYU.systemPrompt}

【任务】
用户刚做完六维测评。根据分数，用小愈的口气跟对方说几句。把分数讲成人话，不要写成报告。
（本任务不受「120-220 字」限制。）

【怎么说】
- 像真人聊天：清楚、自然、有点温度就够了。
- 少用故意文艺的词：不要堆「轻轻」「柔软」「地图的光」「姿势」这类修辞。
- 不要「高分端/低分端/极性/报告/根据测评结果显示」。
- 不鸡汤、不诊断、不评判。
- 可以说「我注意到」「我猜」「也许」，但别每句都这样。

【要说到】
1）12 型名称和那句简介，说明只是此刻的参考。
2）三轴：内核（自稳/外求）、行动（冲锋/运筹）、情绪（炽热/温和/冷静），用日常说法。
3）六个维度都点到，可两两合写；每处一句生活里的样子即可。
4）结尾给一个很小的下一步（比如写一张便签）。

【格式】
- Markdown 可以，标题用普通说法：## 三轴 / ## 六个维度 / ## 我想说的 / ## 接下来
- 开头「你好。」结尾「—— 小愈」
- 约 550-800 字，段落短一点。`;

/** 小愈口吻的画像细读 */
export async function generatePortraitReading(
  profile: Profile
): Promise<{ reading: string; source: "llm" | "mock" }> {
  if (!profile.sixDim?.axes) {
    throw new Error("缺少六维画像");
  }

  if (isLLMConfigured()) {
    try {
      const six = profile.sixDim;
      const dimLines = SIX_DIM_META.map((d) => {
        const score = six.scores[d.key];
        const pole = score >= 12 ? d.poleA : d.poleB;
        const blurb = score >= 12 ? d.blurbA : d.blurbB;
        return `- ${d.label} ${score}/20 → 更靠近「${pole}」：${blurb}`;
      }).join("\n");

      const reading = await chatCompletion(
        [
          { role: "system", content: XIAOYU_READING_SYSTEM },
          {
            role: "user",
            content: `根据下面的结果，用小愈的口气跟用户说几句。

用户摘要：${profileDigest(profile)}

12 型：No.${six.personaId}「${six.personaName}」——${six.personaTagline}
三轴：内核 ${six.axes.core.label}（${six.axes.core.score}）；行动 ${six.axes.drive.label}（${six.axes.drive.score}）；情绪 ${six.axes.emotion.label}（${six.axes.emotion.score}）

维度（12 分附近是中间）：
${dimLines}

可参考短句（别照抄）：
${six.report ?? "无"}`,
          },
        ],
        { temperature: 0.8, maxTokens: 1400 }
      );
      return { reading, source: "llm" };
    } catch (err) {
      console.error("[portrait-analysis] llm failed, fallback mock", err);
    }
  }

  return { reading: mockPortraitReading(profile), source: "mock" };
}
