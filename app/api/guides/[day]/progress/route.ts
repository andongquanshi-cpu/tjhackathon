import { NextResponse } from "next/server";
import { dailyGuide } from "@/lib/prompts";
import { getDayProgress, setDayProgress } from "@/lib/store";

function parseDay(value: string): number | null {
  const day = Number(value);
  return Number.isInteger(day) && day >= 1 && day <= 21 ? day : null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ day: string }> }
) {
  const { day: rawDay } = await params;
  const day = parseDay(rawDay);
  if (!day) return NextResponse.json({ error: "invalid day" }, { status: 400 });
  return NextResponse.json({ guide: dailyGuide(day), progress: getDayProgress(day) });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ day: string }> }
) {
  const { day: rawDay } = await params;
  const day = parseDay(rawDay);
  if (!day) return NextResponse.json({ error: "invalid day" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const validTaskIds = new Set(dailyGuide(day).tasks.map((task) => task.id));
  const completedTaskIds = Array.isArray(body.completedTaskIds)
    ? body.completedTaskIds.map(String).filter((id: string) => validTaskIds.has(id))
    : [];
  return NextResponse.json({ progress: setDayProgress(day, completedTaskIds) });
}
