import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { dayPrompt } from "@/lib/prompts";
import { addNote, currentDay, getNotes, getProfile } from "@/lib/store";
import type { Note } from "@/lib/types";

export async function GET() {
  return NextResponse.json({ notes: getNotes() });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const content = String(body.content ?? "").trim();
  if (!content) {
    return NextResponse.json({ error: "便签内容不能为空" }, { status: 400 });
  }
  const mood = Math.max(1, Math.min(5, Number(body.mood) || 3));
  const profile = getProfile();
  const day = currentDay(profile);

  const note: Note = {
    id: randomUUID(),
    day,
    prompt: dayPrompt(day),
    content,
    mood,
    createdAt: new Date().toISOString(),
    comments: null,
    conversations: {},
  };
  addNote(note);
  return NextResponse.json({ note });
}