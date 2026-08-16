import { NextResponse } from "next/server";
import { generateSessionFeedback } from "@/lib/feedback";
import { getNote, getProfile, updateNote } from "@/lib/store";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const note = getNote(id);
  if (!note) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!note.comments?.length) {
    return NextResponse.json({ error: "请先完成圆桌回应" }, { status: 400 });
  }
  if (note.feedback) return NextResponse.json({ feedback: note.feedback });

  const feedback = await generateSessionFeedback(note, getProfile());
  updateNote(id, { feedback });
  return NextResponse.json({ feedback });
}
