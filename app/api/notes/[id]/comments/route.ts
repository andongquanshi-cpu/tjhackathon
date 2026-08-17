import { NextResponse } from "next/server";
import { generateComments } from "@/lib/agents";
import { evaluateRisk } from "@/lib/risk";
import { getNote, getProfile, updateNote } from "@/lib/store";
import { recallUserMemory, resolveMemoryUserId } from "@/lib/memory";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const note = getNote(id);
  if (!note) return NextResponse.json({ error: "not found" }, { status: 404 });
  const risk = note.risk ?? evaluateRisk(note.content, getProfile());
  if (risk?.level === "crisis") {
    if (!note.risk) updateNote(id, { risk });
    return NextResponse.json(
      { error: "crisis_safety_short_circuit", risk },
      { status: 409 }
    );
  }

  if (note.comments && note.comments.length > 0) {
    return NextResponse.json({ comments: note.comments });
  }

  const sharedMemory = await recallUserMemory(resolveMemoryUserId(req), note.content);
  const comments = await generateComments(note, getProfile(), sharedMemory);
  const updated = updateNote(id, { comments });
  return NextResponse.json({ comments: updated?.comments ?? comments });
}
