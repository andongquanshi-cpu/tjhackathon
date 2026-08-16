"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QUESTIONS, DIM_META } from "@/lib/assessment";
import XiaoyuAvatar from "@/components/XiaoyuAvatar";

const SCALE = [
  { v: 1, label: "完全不像我" },
  { v: 2, label: "不太像我" },
  { v: 3, label: "有时如此" },
  { v: 4, label: "比较像我" },
  { v: 5, label: "非常像我" },
];

export default function AssessmentPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const question = QUESTIONS[step];
  const done = step === QUESTIONS.length - 1;

  const setAnswer = (qid: string, v: number) => {
    setAnswers((a) => ({ ...a, [qid]: v }));
    setError("");
  };

  const submit = async () => {
    if (!answers[question.id]) {
      setError("先选择一个最接近你的答案");
      return;
    }
    if (!done) {
      setStep((value) => value + 1);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (res.ok) {
        router.push("/journal?welcome=1");
      } else {
        setError("暂时无法保存，请稍后再试");
      }
    } catch {
      setError("网络似乎走神了，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="assessment-shell min-h-screen px-5 py-8">
      <header className="mx-auto flex max-w-5xl items-center justify-between">
        <button
          onClick={() => (step === 0 ? router.push("/") : setStep((value) => value - 1))}
          className="line-button"
        >
          ← {step === 0 ? "暂时不测试" : "上一题"}
        </button>
        <span className="font-serif text-sm tracking-[0.24em] text-stone-500">
          进度条 {step + 1}/{QUESTIONS.length}
        </span>
      </header>

      <section className="mx-auto mt-14 max-w-4xl">
        <div className="mb-5 h-px bg-stone-300">
          <div
            className="h-1 -translate-y-1/2 bg-stone-800 transition-all duration-500"
            style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }}
          />
        </div>
        <div className="question-card">
          <span className="eyebrow">
            {DIM_META.find((item) => item.key === question.dim)?.label}
          </span>
          <h1 className="mt-5 max-w-2xl font-serif text-3xl leading-relaxed text-stone-900 sm:text-4xl">
            {question.text}
          </h1>
          <p className="mt-4 text-sm text-stone-500">不必思考太久，选择第一直觉就好。</p>

          <div className="mt-10 grid gap-3 sm:grid-cols-5">
            {SCALE.map((item) => (
              <button
                key={item.v}
                onClick={() => setAnswer(question.id, item.v)}
                className={`answer-option ${answers[question.id] === item.v ? "is-active" : ""}`}
              >
                <span className="text-xl font-semibold">{item.v}</span>
                <span className="text-xs">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 flex items-center gap-5">
          <XiaoyuAvatar variant="host" size="sm" />
          <div className="speech-line">我会记住你的选择，但不会给你贴标签。</div>
        </div>

        <div className="mt-10 flex items-center justify-end gap-4">
          {error && <p className="text-sm text-rose-700">{error}</p>}
          <button onClick={submit} disabled={submitting} className="primary-pill">
            {submitting ? "正在整理…" : done ? "完成，去见小愈 →" : "下一题 →"}
          </button>
        </div>
      </section>
    </main>
  );
}