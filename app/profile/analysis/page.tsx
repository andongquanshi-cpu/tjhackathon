import { Suspense } from "react";
import ProfileAnalysisView from "@/components/ProfileAnalysisView";
import AppNav from "@/components/AppNav";
import { currentDay, getProfile } from "@/lib/store";

export default function ProfileAnalysisPage() {
  const profile = getProfile();
  return (
    <>
      <AppNav day={currentDay(profile)} />
      <Suspense
        fallback={
          <main className="profile-page mx-auto max-w-3xl px-5 py-16 text-stone-500">
            正在打开分析页…
          </main>
        }
      >
        <ProfileAnalysisView initialProfile={profile} />
      </Suspense>
    </>
  );
}
