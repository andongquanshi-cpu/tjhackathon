import { Suspense } from "react";
import WoodfishPractice from "@/components/WoodfishPractice";

export default function WoodfishPage() {
  return (
    <Suspense fallback={<main className="practice-page"><p className="practice-loading">正在准备木鱼…</p></main>}>
      <WoodfishPractice />
    </Suspense>
  );
}
