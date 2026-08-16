"use client";

import { useState } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import XiaoyuAvatar from "@/components/XiaoyuAvatar";

const PHASES = [
  { v: 7, label: "第 7 天 · 觉察" },
  { v: 14, label: "第 14 天 · 接纳" },
  { v: 21, label: "第 21 天 · 转化" },
];

export default function SummaryPage() {
  const [phase, setPhase] = useState(7);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "生成失败");
        return;
      }
      setSummary(data.summary);
    } catch (err) {
      console.error(err);
      setError("生成失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="summary-page min-h-screen">
      <AppNav />
      <section className="summary-layout">
        <aside>
          <XiaoyuAvatar variant="host" size="lg" />
          <span className="eyebrow">PHASE REVIEW</span>
          <h1>阶段回望</h1>
          <p>小愈会结合你的画像和这些天的记录，写一份只属于这个阶段的小结。</p>
          <Link href="/journal">← 返回主界面</Link>
        </aside>

        <article className="summary-paper">
          <div className="summary-phases">
            {PHASES.map((item) => (
              <button
                key={item.v}
                onClick={() => {
                  setPhase(item.v);
                  setSummary(null);
                }}
                className={phase === item.v ? "is-active" : ""}
              >
                <span>DAY {item.v}</span>
                <b>{item.label.split("·")[1]}</b>
              </button>
            ))}
          </div>

          <button onClick={generate} disabled={loading} className="primary-pill">
            {loading ? "小愈正在回顾你的旅程…" : "生成这一阶段的回望 →"}
          </button>
          {error && <p className="summary-error">{error}</p>}
          {summary ? (
            <div className="summary-result fade-up">
              <p>{summary}</p>
              <span>—— 小愈</span>
            </div>
          ) : (
            <div className="summary-empty">
              <span>选择一个阶段</span>
              <p>让散落在记录、圆桌与画像中的变化，聚成一封回信。</p>
            </div>
          )}
        </article>
      </section>
    </main>
  );
}