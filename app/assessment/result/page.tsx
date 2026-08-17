"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SIX_DIM_META, sixDimPercent, type SixDimResult } from "@/lib/six-dim";
import type { Profile } from "@/lib/types";
import RadarChart from "@/components/RadarChart";
import XiaoyuAvatar from "@/components/XiaoyuAvatar";

const LEVEL_LABEL = { high: "高", mid: "中", low: "低" } as const;

export default function AssessmentResultPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        if (!data.profile?.sixDim) {
          setError("还没有测评结果，先去做量表吧。");
          return;
        }
        setProfile(data.profile);
      } catch {
        setError("结果暂时读不出来，请稍后重试。");
      }
    })();
  }, []);

  const result = useMemo(() => {
    if (!profile?.sixDim) return null;
    const six = profile.sixDim;
    const cards = SIX_DIM_META.map((d) => {
      const score = six.scores[d.key];
      const bit = (score >= 12 ? 1 : 0) as 0 | 1;
      const level = score >= 16 ? "high" : score >= 10 ? "mid" : "low";
      return {
        key: d.key,
        score,
        bit,
        level: level as "high" | "mid" | "low",
        poleLabel: bit === 1 ? d.poleA : d.poleB,
        blurb: bit === 1 ? d.blurbA : d.blurbB,
      };
    });
    return {
      scores: six.scores,
      bits: six.bits,
      letterCode: six.letterCode,
      personaName: six.personaName,
      personaTagline: six.personaTagline,
      cards,
    } satisfies SixDimResult;
  }, [profile]);

  if (error) {
    return (
      <main className="assessment-shell min-h-screen px-5 py-16 text-center">
        <XiaoyuAvatar variant="host" size="md" />
        <p className="mt-4 text-stone-600">{error}</p>
        <Link href="/assessment" className="primary-pill mt-6 inline-flex">
          去做测评 →
        </Link>
      </main>
    );
  }

  if (!profile || !result) {
    return (
      <main className="assessment-shell min-h-screen px-5 py-16 text-center text-stone-500">
        正在展开你的六维地图…
      </main>
    );
  }

  const groups = [
    { id: "self", label: "自我模型", keys: ["agency", "attachment"] as const },
    { id: "action", label: "行动模型", keys: ["defense", "action"] as const },
    { id: "cognition", label: "认知模型", keys: ["processing", "decision"] as const },
  ];

  return (
    <main className="assessment-shell assessment-result min-h-screen px-5 py-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex items-start justify-between gap-4">
          <div>
            <span className="eyebrow">SIX-DIM RESULT</span>
            <h1 className="mt-2 font-serif text-4xl text-stone-900">你的六维画像</h1>
          </div>
          <Link href="/journal" className="primary-pill">
            开始 21 天 →
          </Link>
        </header>

        <section className="result-hero fade-up">
          <XiaoyuAvatar variant="host" size="md" />
          <div>
            <p className="result-code">{result.letterCode}</p>
            <h2>{result.personaName}</h2>
            <p className="result-tagline">{result.personaTagline}</p>
            <p className="result-dna">人格 DNA · {result.bits}</p>
            <p className="result-body">{profile.sixDim.report}</p>
          </div>
        </section>

        <section className="mt-12">
          <span className="eyebrow">DIMENSIONS</span>
          <h3 className="mt-2 font-serif text-2xl">六个维度</h3>
          <div className="mt-6 grid gap-6">
            {groups.map((group) => (
              <div key={group.id}>
                <p className="mb-3 text-xs tracking-[0.16em] text-stone-500">{group.label}</p>
                <div className="grid gap-4 md:grid-cols-2">
                  {group.keys.map((key) => {
                    const meta = SIX_DIM_META.find((d) => d.key === key)!;
                    const card = result.cards.find((c) => c.key === key)!;
                    return (
                      <article key={key} className="result-dim-card">
                        <header>
                          <span style={{ color: meta.color }}>
                            {meta.short} · {meta.label}
                          </span>
                          <b>{LEVEL_LABEL[card.level]}</b>
                        </header>
                        <div className="result-dim-score">
                          <strong>{card.score}</strong>
                          <span>/20 · {card.poleLabel}</span>
                        </div>
                        <div className="result-dim-bar">
                          <i style={{ width: `${sixDimPercent(card.score)}%`, background: meta.color }} />
                        </div>
                        <p>{card.blurb}</p>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="result-radar">
            <span className="eyebrow">RADAR</span>
            <h3 className="mt-2 font-serif text-2xl">六维雷达</h3>
            <p className="mt-2 text-sm text-stone-500">虚线位置约为 12 分阈值（极性分界）。</p>
            <RadarChart values={result.scores} max={20} threshold={12} />
          </div>
          <div className="result-report">
            <span className="eyebrow">READING</span>
            <h3 className="mt-2 font-serif text-2xl">此刻的解读</h3>
            <p className="mt-4 leading-relaxed text-stone-600">{profile.sixDim.report}</p>
            <p className="mt-4 text-sm text-stone-500">
              六维分只由测评决定。之后圆桌深聊会沉淀议题、模式与优势，但不会改动这组分数。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/journal" className="primary-pill">
                进入主界面 →
              </Link>
              <Link href="/assessment" className="line-button">
                重新测评
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
