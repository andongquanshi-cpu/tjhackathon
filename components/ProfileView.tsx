"use client";

import Link from "next/link";
import { SIX_DIM_META, sixDimPercent } from "@/lib/six-dim";
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
  if (!initialProfile?.sixDim) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="flex justify-center"><XiaoyuAvatar variant="host" size="md" /></div>
        <p className="mt-4 text-slate-500">还没有画像，先完成六维测评吧。</p>
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
  const six = profile.sixDim;

  return (
    <main className="profile-page mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <span className="eyebrow">INNER PORTRAIT</span>
          <h1 className="mt-2 font-serif text-4xl text-stone-900">我的心理画像</h1>
          <p className="mt-2 text-sm text-stone-500">六维分由测评锁定；议题、模式与优势会随对话生长。</p>
        </div>
        <div className="flex gap-3">
          <Link href="/assessment/result" className="line-button">查看结果页</Link>
          <Link href="/assessment" className="line-button">重新测评</Link>
        </div>
      </div>

      {isNew && (
        <div className="fade-up mb-6 rounded-2xl bg-teal-50 px-5 py-4 text-sm text-teal-800 ring-1 ring-teal-200">
          伊始画像已建立。六维分不会被圆桌改动；每次深聊只会沉淀议题、模式与优势。
        </div>
      )}

      <section className="mb-8 rounded-3xl bg-white/85 p-6 shadow-sm ring-1 ring-slate-100">
        <p className="text-xs tracking-[0.16em] text-stone-500">{six.letterCode} · DNA {six.bits}</p>
        <h2 className="mt-2 font-serif text-3xl text-stone-900">{six.personaName}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">{six.personaTagline}</p>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white/85 p-6 shadow-sm ring-1 ring-slate-100">
          <RadarChart values={six.scores} max={20} threshold={12} />
        </div>

        <div className="space-y-4">
          {SIX_DIM_META.map((d) => (
            <div key={d.key} className="rounded-2xl bg-white/85 p-4 shadow-sm ring-1 ring-slate-100">
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-sm font-semibold" style={{ color: d.color }}>
                  {d.label} · {six.scores[d.key]}/20
                </span>
                <span className="text-xs text-slate-400">{d.hint}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${sixDimPercent(six.scores[d.key])}%`, background: d.color }}
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
