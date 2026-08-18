"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LIKERT_LABELS,
  SIX_DIM_META,
  SIX_DIM_QUESTIONS,
} from "@/lib/six-dim";
import XiaoyuAvatar from "@/components/XiaoyuAvatar";

const DRAFT_KEY = "yuxingxiang-sixdim-draft";

export default function AssessmentPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { answers?: Record<string, number>; step?: number };
        if (parsed.answers) setAnswers(parsed.answers);
        if (typeof parsed.step === "number") {
          setStep(Math.max(0, Math.min(SIX_DIM_QUESTIONS.length - 1, parsed.step)));
        }
      }
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ answers, step }));
  }, [answers, step, ready]);

  const question = SIX_DIM_QUESTIONS[step];
  const done = step === SIX_DIM_QUESTIONS.length - 1;
  const answeredCount = useMemo(
    () => SIX_DIM_QUESTIONS.filter((q) => Number.isFinite(answers[q.id])).length,
    [answers]
  );
  const dimMeta = SIX_DIM_META.find((d) => d.key === question.dim);

  const setAnswer = (qid: string, v: number) => {
    setAnswers((prev) => ({ ...prev, [qid]: v }));
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
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        window.localStorage.removeItem(DRAFT_KEY);
        router.push("/profile?new=1");
      } else {
        setError(data.error ?? "暂时无法保存，请稍后再试");
      }
    } catch {
      setError("网络似乎走神了，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) {
    return <main className="assessment-shell min-h-screen px-5 py-8" />;
  }

  return (
    <main className="assessment-shell min-h-screen px-5 py-8">
      <header className="mx-auto flex max-w-5xl items-center justify-between">
        <button
          onClick={() => (step === 0 ? router.push("/journal") : setStep((value) => value - 1))}
          className="line-button"
        >
          ← {step === 0 ? "暂时不测试" : "上一题"}
        </button>
        <span className="font-serif text-sm tracking-[0.24em] text-stone-500">
          {question.kind === "scenario" ? "情景" : "量表"} · {step + 1}/{SIX_DIM_QUESTIONS.length}
          <em className="ml-2 not-italic text-stone-400">已答 {answeredCount}</em>
        </span>
      </header>

      <section className="mx-auto mt-14 max-w-4xl">
        <div className="mb-5 h-px bg-stone-300">
          <div
            className="h-1 -translate-y-1/2 bg-stone-800 transition-all duration-500"
            style={{ width: `${((step + 1) / SIX_DIM_QUESTIONS.length) * 100}%` }}
          />
        </div>
        <div className="question-card">
          <span className="eyebrow">
            {dimMeta?.short} · {dimMeta?.label}
            {question.kind === "scenario" ? " · PART 1" : " · PART 2"}
          </span>
          <h1 className="mt-5 max-w-3xl font-serif text-3xl leading-relaxed text-stone-900 sm:text-4xl">
            {question.text}
          </h1>
          <p className="mt-4 text-sm text-stone-500">
            {question.kind === "scenario"
              ? "选最贴近你第一反应的那一项。"
              : "1=非常不同意，5=非常同意。不必思考太久。"}
          </p>

          {question.kind === "scenario" ? (
            <div className="mt-10 grid gap-3">
              {question.options?.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setAnswer(question.id, opt.score)}
                  className={`answer-option answer-option--row ${answers[question.id] === opt.score ? "is-active" : ""}`}
                >
                  <span className="text-lg font-semibold">{opt.key}</span>
                  <span className="text-left text-sm leading-relaxed">{opt.text}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-10 grid gap-3 sm:grid-cols-5">
              {LIKERT_LABELS.map((item) => (
                <button
                  key={item.v}
                  type="button"
                  onClick={() => setAnswer(question.id, item.v)}
                  className={`answer-option ${answers[question.id] === item.v ? "is-active" : ""}`}
                >
                  <span className="text-xl font-semibold">{item.v}</span>
                  <span className="text-xs">{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center gap-5">
          <XiaoyuAvatar variant="host" size="sm" />
          <div className="speech-line">六维量表会帮我们更懂你一点，但不会给你贴死标签。</div>
        </div>

        <div className="mt-10 flex items-center justify-end gap-4">
          {error && <p className="text-sm text-rose-700">{error}</p>}
          <button onClick={submit} disabled={submitting} className="primary-pill">
            {submitting ? "正在整理…" : done ? "完成，生成画像 →" : "下一题 →"}
          </button>
        </div>
      </section>
    </main>
  );
}
