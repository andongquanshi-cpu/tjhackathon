"use client";

import Link from "next/link";
import { DIM_META } from "@/lib/assessment";
import type { Profile } from "@/lib/types";
import RadarChart from "./RadarChart";
import XiaoyuAvatar from "./XiaoyuAvatar";

export default function ProfileView({
  isNew,
  initialProfile,
}: {
  isNew: boolean;
  initialProfile: Profile | null;
}) {
  if (!initialProfile) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="flex justify-center"><XiaoyuAvatar variant="host" size="md" /></div>
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

  const profile = initialProfile;

  return (
    <main className="profile-page mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <span className="eyebrow">INNER PORTRAIT</span>
          <h1 className="mt-2 font-serif text-4xl text-stone-900">我的心理画像</h1>
          <p className="mt-2 text-sm text-stone-500">它不是结论，而是一张会随着每次对话生长的地图。</p>
        </div>
        <Link href="/assessment" className="line-button">重新测评</Link>
      </div>

      {isNew && (
        <div className="fade-up mb-6 rounded-2xl bg-teal-50 px-5 py-4 text-sm text-teal-800 ring-1 ring-teal-200">
          伊始画像已建立。从今天开始，每次深聊都会被沉淀进这张画像里。
        </div>
      )}

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