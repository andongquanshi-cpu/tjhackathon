"use client";

import Link from "next/link";
import { SIX_DIM_META, sixDimPercent } from "@/lib/six-dim";
import type { Profile } from "@/lib/types";
import PersonaPortrait from "./PersonaPortrait";
import RadarChart from "./RadarChart";
import XiaoyuAvatar from "./XiaoyuAvatar";

const LEVEL_LABEL = { high: "高", mid: "中", low: "低" } as const;

function levelOf(score: number): "high" | "mid" | "low" {
  if (score >= 16) return "high";
  if (score >= 10) return "mid";
  return "low";
}

export default function ProfileView({
  isNew,
  initialProfile,
}: {
  isNew: boolean;
  initialProfile: Profile | null;
}) {
  if (!initialProfile?.sixDim?.axes) {
    return (
      <main className="profile-page mx-auto max-w-3xl px-5 py-16 text-center">
        <div className="flex justify-center">
          <XiaoyuAvatar variant="host" size="md" />
        </div>
        <p className="mt-4 text-stone-600">还没有完成六维测评，或需要按新版量表重测。</p>
        <p className="mt-2 text-sm text-stone-500">你可以先在主界面随便看看；想建立画像时，随时从这里补上。</p>
        <Link href="/assessment" className="primary-pill mt-6 inline-flex">
          去做测评 →
        </Link>
        <div className="mt-4">
          <Link href="/journal" className="line-button">
            ← 先回主界面
          </Link>
        </div>
      </main>
    );
  }

  const profile = initialProfile;
  const six = profile.sixDim;
  const hasReading = Boolean(six.aiReading);

  const groups = [
    { id: "self", label: "自我模型", keys: ["agency", "attachment"] as const },
    { id: "action", label: "表达模型", keys: ["defense", "action"] as const },
    { id: "cognition", label: "认知模型", keys: ["processing", "decision"] as const },
  ];

  return (
    <main className="profile-page assessment-result mx-auto max-w-6xl px-5 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">INNER PORTRAIT</span>
          <h1 className="mt-2 font-serif text-4xl text-stone-900">我的心理画像</h1>
          <p className="mt-2 max-w-xl text-sm text-stone-500">
            六维分由测评锁定；议题、模式与优势会随对话生长。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={hasReading ? "/profile/analysis" : "/profile/analysis?run=1"}
            className="primary-pill"
          >
            查看小愈分析 →
          </Link>
          <Link href="/assessment" className="line-button">
            重新测评
          </Link>
        </div>
      </header>

      {isNew && (
        <div className="fade-up mb-6 rounded-2xl bg-teal-50 px-5 py-4 text-sm text-teal-800 ring-1 ring-teal-200">
          伊始画像已建立。六维分不会被圆桌改动；每次深聊只会沉淀议题、模式与优势。
        </div>
      )}

      <section className="result-hero fade-up">
        <PersonaPortrait personaId={six.personaId} personaName={six.personaName} size="lg" />
        <div>
          <p className="result-code">
            12 型 · No.{six.personaId ?? "—"} · {six.axes.core.label} · {six.axes.drive.label} ·{" "}
            {six.axes.emotion.label}
          </p>
          <h2>{six.personaName}</h2>
          <p className="result-tagline">{six.personaTagline}</p>
          <div className="result-axes">
            <span>
              内核 {six.axes.core.label}（{six.axes.core.score}）
            </span>
            <span>
              行动 {six.axes.drive.label}（{six.axes.drive.score}）
            </span>
            <span>
              情绪 {six.axes.emotion.label}（{six.axes.emotion.score}）
            </span>
          </div>
          <p className="result-axes-hint">
            内核看你更靠自己还是靠外界确认；行动看你先冲还是先想；情绪看感受外露多少。括号里是合成分。
          </p>
          <p className="result-body">
            {six.report ??
              `你更接近「${six.personaName}」——${six.personaTagline}。这不是标签，只是此刻的一张小地图。`}
          </p>
        </div>
      </section>

      <section className="profile-map profile-map--flat mt-8">
        <div className="result-radar profile-radar">
          <span className="eyebrow">RADAR</span>
          <h3 className="mt-1 font-serif text-xl">六维雷达</h3>
          <p className="mt-1 text-xs text-stone-500">虚线约为 12 分阈值（极性分界）。</p>
          <RadarChart values={six.scores} max={20} threshold={12} size={300} />
        </div>

        <div className="profile-dims">
          <span className="eyebrow">DIMENSIONS</span>
          <h3 className="mt-1 font-serif text-xl">六个维度</h3>
          <div className="profile-dims__groups mt-3">
            {groups.map((group) => (
              <div key={group.id}>
                <p className="profile-dims__label">{group.label}</p>
                <div className="profile-dims__grid">
                  {group.keys.map((key) => {
                    const meta = SIX_DIM_META.find((d) => d.key === key)!;
                    const score = six.scores[key];
                    const bit = (score >= 12 ? 1 : 0) as 0 | 1;
                    const level = levelOf(score);
                    const poleLabel = bit === 1 ? meta.poleA : meta.poleB;
                    const blurb = bit === 1 ? meta.blurbA : meta.blurbB;
                    return (
                      <article key={key} className="result-dim-card result-dim-card--flat">
                        <header>
                          <span style={{ color: meta.color }}>
                            {meta.short} · {meta.label}
                          </span>
                          <b>{LEVEL_LABEL[level]}</b>
                        </header>
                        <div className="result-dim-score">
                          <strong>{score}</strong>
                          <span>/20 · {poleLabel}</span>
                        </div>
                        <div className="result-dim-bar">
                          <i style={{ width: `${sixDimPercent(score)}%`, background: meta.color }} />
                        </div>
                        <p>{blurb}</p>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="profile-living mt-10">
        {[
          { title: "核心议题", items: profile.coreIssues, color: "#f43f5e" },
          { title: "认知模式", items: profile.cognitivePatterns, color: "#f59e0b" },
          { title: "优势资源", items: profile.strengths, color: "#10b981" },
        ].map((sec) => (
          <div key={sec.title} className="result-report">
            <div className="mb-3 text-sm font-semibold" style={{ color: sec.color }}>
              {sec.title}
            </div>
            {sec.items.length === 0 ? (
              <p className="text-xs text-stone-400">多写几张便签、多聊几轮，这里会长出来。</p>
            ) : (
              <ul className="space-y-1.5">
                {sec.items.map((it, i) => (
                  <li key={i} className="text-sm text-stone-600">
                    · {it}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </section>

      <section className="result-report mt-8">
        <div className="mb-3 text-sm font-semibold text-stone-600">变化轨迹</div>
        {profile.timeline.length === 0 ? (
          <p className="text-xs text-stone-400">暂无记录。</p>
        ) : (
          <ol className="space-y-2">
            {profile.timeline
              .slice()
              .reverse()
              .map((t, i) => (
                <li key={i} className="flex gap-2 text-sm text-stone-500">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
                  {t}
                </li>
              ))}
          </ol>
        )}
      </section>
    </main>
  );
}
