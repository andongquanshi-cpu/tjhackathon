"use client";

import { useState } from "react";
import Link from "next/link";

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
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link href="/journal" className="text-sm text-slate-500 hover:text-slate-800">
          ← 便签本
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-slate-800">阶段性 AI 总结</h1>
      <p className="mt-1 text-sm text-slate-500">
        小愈会结合你的画像和这些天的便签，写一份阶段小结。
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {PHASES.map((p) => (
          <button
            key={p.v}
            onClick={() => {
              setPhase(p.v);
              setSummary(null);
            }}
            className={`rounded-full px-4 py-2 text-sm transition ${
              phase === p.v
                ? "bg-teal-600 font-medium text-white shadow-sm"
                : "bg-white/80 text-slate-600 ring-1 ring-slate-200 hover:bg-white"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <button
        onClick={generate}
        disabled={loading}
        className="mt-6 rounded-full bg-teal-600 px-8 py-3 font-medium text-white shadow-md transition hover:bg-teal-500 disabled:opacity-50"
      >
        {loading ? "小愈正在回顾你的旅程…" : "生成总结 ✨"}
      </button>

      {error && <p className="mt-4 text-sm text-rose-500">{error}</p>}

      {summary && (
        <div className="fade-up note-paper mt-8 p-6 pt-9">
          <p className="whitespace-pre-wrap text-[15px] leading-7 text-slate-700">{summary}</p>
          <p className="mt-5 text-right text-sm text-teal-600">—— 小愈 🌱</p>
        </div>
      )}
    </main>
  );
}