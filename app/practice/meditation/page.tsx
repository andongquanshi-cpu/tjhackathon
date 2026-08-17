import { Suspense } from "react";
import MeditationPractice from "@/components/MeditationPractice";

export default function MeditationPage() {
  return (
    <Suspense fallback={<main className="practice-page"><p className="practice-loading">正在准备冥想…</p></main>}>
      <MeditationPractice />
    </Suspense>
  );
}
