"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QUESTIONS, DIM_META } from "@/lib/assessment";

const SCALE = [
  { v: 1, label: "非常不符合" },
  { v: 2, label: "不太符合" },
  { v: 3, label: "一般" },
  { v: 4, label: "比较符合" },
  { v: 5, label: "非常符合" },
];

export default function AssessmentPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  const answered = Object.keys(answers).length;
  const done = answered === QUESTIONS.length;

  const setAnswer = (qid: string, v: number) =>
    setAnswers((a) => ({ ...a, [qid]: v }));

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (res.ok) {
        router.push("/profile?new=1");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-2 text-center text-4xl">🌱</div>
      <h1 className="text-center text-2xl font-bold text-slate-800">初始测评</h1>
      <p className="mt-2 text-center text-sm text-slate-500">
        回答 10 道小题，小愈会帮你画出 5 个维度的伊始画像。没有对错，凭直觉就好。
      </p>

      <div className="mx-auto mt-6 h-2 w-full max-w-md overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-teal-500 transition-all"
          style={{ width: `${(answered / QUESTIONS.length) * 100}%` }}
        />
      </div>

      <div className="mt-8 space-y-5">
        {QUESTIONS.map((q, qi) => (
          <div key={q.id} className="rounded-3xl bg-white/85 p-5 shadow-sm ring-1 ring-slate-100">
            <div className="mb-3 flex items-start gap-2">
              <span
                className="mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white"
                style={{ background: DIM_META.find((d) => d.key === q.dim)?.color }}
              >
                {DIM_META.find((d) => d.key === q.dim)?.label}
              </span>
              <span className="text-sm leading-6 text-slate-700">
                {qi + 1}. {q.text}
              </span>
            </div>
            <div className="flex gap-1.5">
              {SCALE.map((s) => (
                <button
                  key={s.v}
                  onClick={() => setAnswer(q.id, s.v)}
                  className={`flex-1 rounded-xl py-2 text-xs transition ${
                    answers[q.id] === s.v
                      ? "bg-teal-600 font-medium text-white shadow-sm"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                  title={s.label}
                >
                  {s.v}
                  <span className="mt-0.5 block text-[10px] opacity-70">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={submit}
          disabled={!done || submitting}
          className="rounded-full bg-teal-600 px-10 py-3 font-medium text-white shadow-md transition hover:bg-teal-500 disabled:opacity-40"
        >
          {submitting ? "生成中…" : done ? "完成测评，建立画像 →" : `还剩 ${QUESTIONS.length - answered} 题`}
        </button>
      </div>
    </main>
  );
}