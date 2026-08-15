import { NextResponse } from "next/server";
import { generateComments } from "@/lib/agents";
import { getNote, getProfile, updateNote } from "@/lib/store";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const note = getNote(id);
  if (!note) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (note.comments && note.comments.length > 0) {
    return NextResponse.json({ comments: note.comments });
  }

  const comments = await generateComments(note, getProfile());
  const updated = updateNote(id, { comments });
  return NextResponse.json({ comments: updated?.comments ?? comments });
}