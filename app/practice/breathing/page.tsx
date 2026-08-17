import { Suspense } from "react";
import BreathingPractice from "@/components/BreathingPractice";

export default function BreathingPage() {
  return (
    <Suspense fallback={<main className="practice-page"><p className="practice-loading">正在准备呼吸练习…</p></main>}>
      <BreathingPractice />
    </Suspense>
  );
}
