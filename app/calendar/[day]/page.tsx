import { notFound } from "next/navigation";
import AppNav from "@/components/AppNav";
import DayDetailView from "@/components/DayDetailView";
import { dailyGuide } from "@/lib/prompts";
import { currentDay, getDayProgress, getNotes, getProfile } from "@/lib/store";
import { trainingDate } from "@/lib/calendar";

export default async function CalendarDayPage({
  params,
}: {
  params: Promise<{ day: string }>;
}) {
  const { day: rawDay } = await params;
  const day = Number(rawDay);
  if (!Number.isInteger(day) || day < 1 || day > 21) notFound();

  const profile = getProfile();
  const today = currentDay(profile);
  const date = trainingDate(profile, day);
  const dateLabel = date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <main className="day-detail-page min-h-screen">
      <AppNav day={today} />
      <DayDetailView
        day={day}
        dateLabel={dateLabel}
        notes={getNotes().filter((note) => note.day === day)}
        guide={dailyGuide(day)}
        progress={getDayProgress(day)}
      />
    </main>
  );
}
