/**
 * LLM 调用封装：兼容 OpenAI 协议（OpenAI / DeepSeek / 通义 / 智谱 / Moonshot 等）。
 * 没有配置 API key 时返回 null，由上层走内置 mock，保证离线可跑。
 */

export interface LLMConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface ChatMessageLike {
  role: "system" | "user" | "assistant";
  content: string;
}

export function getLLMConfig(): LLMConfig | null {
  const apiKey = process.env.AI_API_KEY?.trim();
  if (!apiKey) return null;
  return {
    baseUrl: (process.env.AI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/+$/, ""),
    apiKey,
    model: process.env.AI_MODEL ?? "gpt-4o-mini",
  };
}

export function isLLMConfigured(): boolean {
  return getLLMConfig() !== null;
}

export async function chatCompletion(
  messages: ChatMessageLike[],
  opts: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const cfg = getLLMConfig();
  if (!cfg) throw new Error("AI_API_KEY not configured");

  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 800,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`LLM request failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("LLM returned empty content");
  return content.trim();
}

/** 便于上层判断是否处于演示（mock）模式 */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE !== "0";
}