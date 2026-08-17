import type { InputAnalysis } from "./input-analysis";
import type { AgentSource, ChatMessage, SchoolId } from "./types";

export type AgentId = "A" | "B" | "C" | "D";

export interface ExternalAgentResponse {
  agentId: AgentId;
  roleName: string;
  response: string;
  skills: string[];
  sources: AgentSource[];
  degraded: boolean;
  safetyLevel: InputAnalysis["safetyLevel"];
}

const AGENT_BY_SCHOOL: Record<SchoolId, { id: AgentId; env: string }> = {
  psychodynamic: { id: "A", env: "AGENT_A_URL" },
  humanistic: { id: "B", env: "AGENT_B_URL" },
  cognitive: { id: "C", env: "AGENT_C_URL" },
  postmodern: { id: "D", env: "AGENT_D_URL" },
};

export function getAgentId(school: SchoolId): AgentId {
  return AGENT_BY_SCHOOL[school].id;
}

function getAgentUrl(school: SchoolId): string | null {
  const value = process.env[AGENT_BY_SCHOOL[school].env]?.trim();
  return value ? value.replace(/\/+$/, "") : null;
}

function normalizeResponse(raw: unknown, expectedId: AgentId): ExternalAgentResponse {
  if (!raw || typeof raw !== "object") throw new Error("agent returned an invalid payload");
  const value = raw as Record<string, unknown>;
  const response = String(value.response ?? "").trim();
  if (!response) throw new Error("agent returned an empty response");
  const agentId = String(value.agent_id ?? value.agentId ?? expectedId) as AgentId;
  if (agentId !== expectedId) throw new Error(`agent id mismatch: expected ${expectedId}, got ${agentId}`);
  const safetyLevel = String(value.safety_level ?? value.safetyLevel ?? "");
  if (!["S0", "S1", "S2", "S3"].includes(safetyLevel)) {
    throw new Error("agent returned an invalid safety level");
  }
  if (!Array.isArray(value.skills) || !Array.isArray(value.sources) || typeof value.degraded !== "boolean") {
    throw new Error("agent response does not match the shared contract");
  }
  return {
    agentId,
    roleName: String(value.role_name ?? value.roleName ?? expectedId),
    response,
    skills: value.skills.map(String),
    sources: value.sources.map((source) => {
          const item = source as Record<string, unknown>;
          return {
            source: String(item.source ?? "agent"),
            text: typeof item.text === "string" ? item.text : undefined,
            metadata:
              item.metadata && typeof item.metadata === "object"
                ? (item.metadata as Record<string, unknown>)
                : undefined,
          };
        }),
    degraded: value.degraded,
    safetyLevel: safetyLevel as InputAnalysis["safetyLevel"],
  };
}

export async function callExternalAgent(opts: {
  school: SchoolId;
  analysis: InputAnalysis;
  noteContent?: string;
  profileDigest?: string;
  sharedMemory?: string;
  history?: ChatMessage[];
}): Promise<ExternalAgentResponse | null> {
  const url = getAgentUrl(opts.school);
  if (!url) return null;
  const expectedId = AGENT_BY_SCHOOL[opts.school].id;
  const timeoutMs = Math.max(3_000, Number(process.env.AGENT_TIMEOUT_MS) || 20_000);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${url}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_text: opts.analysis.rawInput,
        note_content: opts.noteContent ?? null,
        profile_digest: opts.profileDigest ?? null,
        shared_memory: opts.sharedMemory ?? null,
        history: (opts.history ?? []).map((message) => ({
          role: message.role,
          content: message.content,
        })),
        safety_level: opts.analysis.safetyLevel,
        intents: opts.analysis.intents,
        topics: opts.analysis.topics,
        needs_pause: opts.analysis.needsPause,
      }),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`agent ${expectedId} failed with HTTP ${response.status}`);
    }
    return normalizeResponse(await response.json(), expectedId);
  } finally {
    clearTimeout(timeout);
  }
}
