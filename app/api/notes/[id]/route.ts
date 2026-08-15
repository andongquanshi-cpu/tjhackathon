import { NextResponse } from "next/server";
import { getNote } from "@/lib/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const note = getNote(id);
  if (!note) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ note });
}