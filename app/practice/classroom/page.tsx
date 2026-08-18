import { Suspense } from "react";
import ClassroomPractice from "@/components/ClassroomPractice";

export default function ClassroomPage() {
  return (
    <Suspense
      fallback={
        <main className="practice-page">
          <p className="practice-loading">正在打开心理微课堂…</p>
        </main>
      }
    >
      <ClassroomPractice />
    </Suspense>
  );
}
