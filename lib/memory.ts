import { MemoryClient } from "mem0ai";

const APP_ID = "yuxingxiang";
let client: MemoryClient | null | undefined;

function getClient(): MemoryClient | null {
  if (client !== undefined) return client;
  const apiKey = process.env.MEM0_API_KEY?.trim();
  client = apiKey ? new MemoryClient({ apiKey }) : null;
  return client;
}

export function resolveMemoryUserId(request: Request): string {
  return request.headers.get("x-memory-user-id")?.trim() || "local-preview-user";
}

export async function recallUserMemory(userId: string, query: string): Promise<string> {
  const memory = getClient();
  if (!memory || !query.trim()) return "";
  try {
    const result = await memory.search(query, {
      filters: { AND: [{ user_id: userId }, { app_id: APP_ID }] },
      topK: 6,
      latestOnly: true,
    });
    const items = result.results
      .map((item) => item.memory?.trim())
      .filter((item): item is string => Boolean(item));
    return items.length ? `Shared user memory:\n${items.map((item) => `- ${item}`).join("\n")}` : "";
  } catch (error) {
    console.error("[memory] recall failed", error);
    return "";
  }
}

export async function rememberTurn(opts: {
  userId: string;
  userText: string;
  assistantText: string;
  agentId: string;
  sessionId: string;
}): Promise<void> {
  const memory = getClient();
  if (!memory) return;
  try {
    await memory.add(
      [
        { role: "user", content: opts.userText },
        { role: "assistant", content: opts.assistantText },
      ],
      {
        userId: opts.userId,
        appId: APP_ID,
        runId: opts.sessionId,
        metadata: { origin_agent: opts.agentId, session_id: opts.sessionId },
        customInstructions:
          "Store only durable user preferences, recurring concerns, goals, strengths, relationships, and helpful support patterns. Do not store diagnoses, crisis wording, or transient mood as permanent facts.",
      }
    );
  } catch (error) {
    console.error("[memory] write failed", error);
  }
}
