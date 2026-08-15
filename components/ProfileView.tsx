"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DIM_META } from "@/lib/assessment";
import type { Profile } from "@/lib/types";
import RadarChart from "./RadarChart";

export default function ProfileView({ isNew }: { isNew: boolean }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/profile");
      const data = await res.json();
      setProfile(data.profile ?? null);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <main className="mx-auto max-w-3xl px-4 py-16 text-center text-slate-400">加载中…</main>;
  }

  if (!profile) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="text-4xl">🌱</div>
        <p className="mt-4 text-slate-500">还没有画像，先完成初始测评吧。</p>
        <Link
          href="/assessment"
          className="mt-6 inline-block rounded-full bg-teal-600 px-8 py-3 font-medium text-white shadow-md transition hover:bg-teal-500"
        >
          去做测评 →
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/journal" className="text-sm text-slate-500 hover:text-slate-800">
          ← 便签本
        </Link>
        <div className="flex gap-2">
          <Link href="/summary" className="rounded-full bg-white/70 px-4 py-1.5 text-sm text-slate-600 shadow-sm hover:bg-white">
            阶段总结
          </Link>
          <Link href="/assessment" className="rounded-full bg-teal-600 px-4 py-1.5 text-sm text-white shadow-sm hover:bg-teal-500">
            重新测评
          </Link>
        </div>
      </div>

      {isNew && (
        <div className="fade-up mb-6 rounded-2xl bg-teal-50 px-5 py-4 text-sm text-teal-800 ring-1 ring-teal-200">
          🌱 伊始画像已建立。从今天开始，每次深聊都会被沉淀进这张画像里。
        </div>
      )}

      <h1 className="text-2xl font-bold text-slate-800">我的心理画像</h1>
      <p className="mt-1 text-sm text-slate-500">维度分数 0-100，来自测评与每一次对话的沉淀。</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white/85 p-6 shadow-sm ring-1 ring-slate-100">
          <RadarChart values={profile.dimensions} />
        </div>

        <div className="space-y-4">
          {DIM_META.map((d) => (
            <div key={d.key} className="rounded-2xl bg-white/85 p-4 shadow-sm ring-1 ring-slate-100">
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-sm font-semibold text-slate-700" style={{ color: d.color }}>
                  {d.label}
                </span>
                <span className="text-xs text-slate-400">{d.hint}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${profile.dimensions[d.key]}%`, background: d.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { title: "核心议题", items: profile.coreIssues, color: "#f43f5e" },
          { title: "认知模式", items: profile.cognitivePatterns, color: "#f59e0b" },
          { title: "优势资源", items: profile.strengths, color: "#10b981" },
        ].map((sec) => (
          <div key={sec.title} className="rounded-3xl bg-white/85 p-5 shadow-sm ring-1 ring-slate-100">
            <div className="mb-3 text-sm font-semibold" style={{ color: sec.color }}>
              {sec.title}
            </div>
            {sec.items.length === 0 ? (
              <p className="text-xs text-slate-400">多写几张便签、多聊几轮，这里会长出来。</p>
            ) : (
              <ul className="space-y-1.5">
                {sec.items.map((it, i) => (
                  <li key={i} className="text-sm text-slate-600">
                    · {it}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-3xl bg-white/85 p-5 shadow-sm ring-1 ring-slate-100">
        <div className="mb-3 text-sm font-semibold text-slate-600">变化轨迹</div>
        {profile.timeline.length === 0 ? (
          <p className="text-xs text-slate-400">暂无记录。</p>
        ) : (
          <ol className="space-y-2">
            {profile.timeline
              .slice()
              .reverse()
              .map((t, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-500">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
                  {t}
                </li>
              ))}
          </ol>
        )}
      </div>
    </main>
  );
}