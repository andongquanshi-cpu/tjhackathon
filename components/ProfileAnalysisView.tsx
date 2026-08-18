"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Profile } from "@/lib/types";
import PersonaPortrait from "@/components/PersonaPortrait";
import SimpleMarkdown from "@/components/SimpleMarkdown";
import XiaoyuAvatar from "@/components/XiaoyuAvatar";

export default function ProfileAnalysisView({
  initialProfile,
}: {
  initialProfile: Profile | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldRun = searchParams.get("run") === "1";
  const [profile, setProfile] = useState(initialProfile);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const reading = profile?.sixDim?.aiReading;

  useEffect(() => {
    if (!shouldRun || !profile?.sixDim?.axes || started.current) return;
    started.current = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/profile/analyze", { method: "POST" });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "分析失败");
          return;
        }
        if (data.profile) setProfile(data.profile);
        router.replace("/profile/analysis");
      } catch {
        setError("分析暂时写不出来，请稍后重试。");
      } finally {
        setLoading(false);
      }
    })();
  }, [shouldRun, profile?.sixDim?.axes, router]);

  if (!profile?.sixDim?.axes) {
    return (
      <main className="profile-page mx-auto max-w-3xl px-5 py-16 text-center">
        <XiaoyuAvatar variant="host" size="md" />
        <p className="mt-4 text-stone-600">还没有测评结果。</p>
        <Link href="/assessment" className="primary-pill mt-6 inline-flex">
          去做测评 →
        </Link>
      </main>
    );
  }

  const six = profile.sixDim;

  return (
    <main className="profile-page assessment-result mx-auto max-w-3xl px-5 py-10">
      <div className="mb-6">
        <Link href="/profile" className="line-button">
          ← 返回画像
        </Link>
      </div>

      <header className="mb-8">
        <span className="eyebrow">XIAOYU</span>
        <h1 className="mt-2 font-serif text-4xl text-stone-900">小愈看过之后</h1>
        <p className="mt-2 text-sm text-stone-500">关于你这份六维画像，她想跟你说几句。</p>
      </header>

      <section className="result-hero fade-up mb-8">
        <PersonaPortrait personaId={six.personaId} personaName={six.personaName} size="md" />
        <div>
          <p className="result-code">
            12 型 · No.{six.personaId} · {six.axes.core.label} · {six.axes.drive.label} ·{" "}
            {six.axes.emotion.label}
          </p>
          <h2>{six.personaName}</h2>
          <p className="result-tagline">{six.personaTagline}</p>
        </div>
      </section>

      <article className="result-agent analysis-paper">
        <div className="result-agent__head">
          <XiaoyuAvatar variant="host" size="sm" />
          <div>
            <span className="eyebrow">XIAOYU</span>
            <h3 className="mt-1 font-serif text-2xl">
              {loading ? "稍等一下" : reading ? "她想说的" : "还没有内容"}
            </h3>
          </div>
        </div>

        {loading && <p className="mt-6 text-sm text-stone-500">稍等一下…</p>}
        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

        {!loading && reading && (
          <div className="result-agent__body fade-up">
            <SimpleMarkdown source={reading} />
          </div>
        )}

        {!loading && !reading && !error && (
          <div className="result-agent__empty mt-6">
            <p>还没有内容。点下面开始就行。</p>
            <Link href="/profile/analysis?run=1" className="primary-pill mt-4 inline-flex">
              查看小愈分析 →
            </Link>
          </div>
        )}
      </article>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/profile" className="line-button">
          ← 返回画像
        </Link>
        <Link href="/journal" className="primary-pill">
          进入主界面 →
        </Link>
      </div>
    </main>
  );
}
