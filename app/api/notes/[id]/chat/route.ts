import { NextResponse } from "next/server";
import { chatWithSchool, distillAfterChat } from "@/lib/agents";
import { SCHOOL_IDS } from "@/lib/personas";
import { evaluateRisk } from "@/lib/risk";
import { getNote, getProfile, setProfile, updateNote } from "@/lib/store";
import type { ChatMessage, SchoolId } from "@/lib/types";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const note = getNote(id);
  if (!note) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const school = body.school as SchoolId;
  const message = String(body.message ?? "").trim();
  if (!SCHOOL_IDS.includes(school)) {
    return NextResponse.json({ error: "unknown school" }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ error: "消息不能为空" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const history: ChatMessage[] = note.conversations[school] ?? [];

  const userMsg: ChatMessage = { role: "user", school, content: message, createdAt: now };
  const risk = evaluateRisk(`${note.content}\n${message}`, getProfile());
  if (risk?.level === "crisis") {
    const safeReply: ChatMessage = {
      role: "assistant",
      school,
      content: `${risk.message}${risk.resources?.length ? `\n${risk.resources.join("；")}` : ""}`,
      createdAt: new Date().toISOString(),
      skills: ["crisis-safety-response"],
      sources: [],
      degraded: false,
    };
    const messages = [...history, userMsg, safeReply];
    updateNote(id, {
      risk,
      selectedSchool: school,
      conversations: { ...note.conversations, [school]: messages },
    });
    return NextResponse.json({ reply: safeReply, risk, safetyShortCircuit: true });
  }

  const reply = await chatWithSchool({
    note,
    school,
    history,
    userMsg: message,
    profile: getProfile(),
  });
  const replyMsg: ChatMessage = {
    role: "assistant",
    school,
    content: reply.content,
    createdAt: new Date().toISOString(),
    agentId: reply.agentId,
    skills: reply.skills,
    sources: reply.sources,
    degraded: reply.degraded,
  };

  const messages = [...history, userMsg, replyMsg];
  updateNote(id, {
    selectedSchool: school,
    conversations: { ...note.conversations, [school]: messages },
  });

  // 画像蒸馏：把对话沉淀进用户画像
  const profile = getProfile();
  let distilled = profile;
  if (profile) {
    distilled = await distillAfterChat(note, school, profile, messages);
    setProfile(distilled);
  }

  return NextResponse.json({ reply: replyMsg, profile: distilled });
}