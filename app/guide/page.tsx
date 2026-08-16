import AppNav from "@/components/AppNav";
import DailyGuideView from "@/components/DailyGuideView";
import { dailyGuide } from "@/lib/prompts";
import { currentDay, getDayProgress, getProfile } from "@/lib/store";

export default async function GuidePage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const profile = getProfile();
  const today = currentDay(profile);
  const requested = Number(params.day);
  const day = Number.isInteger(requested) && requested >= 1 && requested <= 21 ? requested : today;
  return (
    <main className="guide-page min-h-screen">
      <AppNav day={today} />
      <DailyGuideView
        guide={dailyGuide(day)}
        initialProgress={getDayProgress(day)}
        currentDay={today}
      />
    </main>
  );
}
