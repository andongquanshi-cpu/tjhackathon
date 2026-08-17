"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import AppNav from "@/components/AppNav";
import XiaoyuAvatar from "@/components/XiaoyuAvatar";

type Phase = "ready" | "running" | "done";

const CYCLES = 6;
const INHALE = 4;
const HOLD = 2;
const EXHALE = 6;
const CYCLE = INHALE + HOLD + EXHALE;

async function markTaskDone(day: number, taskId: string) {
  try {
    const current = await fetch(`/api/guides/${day}/progress`);
    const data = await current.json();
    const completed: string[] = data.progress?.completedTaskIds ?? [];
    if (completed.includes(taskId)) return;
    await fetch(`/api/guides/${day}/progress`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completedTaskIds: [...completed, taskId] }),
    });
  } catch {
    // ignore
  }
}

function breathLabel(tick: number) {
  const pos = tick % CYCLE;
  if (pos < INHALE) return { word: "吸气", hint: "鼻子轻轻吸入" };
  if (pos < INHALE + HOLD) return { word: "停一下", hint: "轻轻停在顶端" };
  return { word: "呼气", hint: "慢慢把气送出去" };
}

export default function BreathingPracticePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const day = Number(searchParams.get("day") || "1");
  const taskId = searchParams.get("task");
  const [phase, setPhase] = useState<Phase>("ready");
  const [tick, setTick] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (phase !== "running") return;
    const timer = window.setInterval(() => {
      setTick((value) => {
        if (value + 1 >= CYCLES * CYCLE) {
          window.clearInterval(timer);
          setPhase("done");
          return CYCLES * CYCLE;
        }
        return value + 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  const label = breathLabel(tick);
  const cycleIndex = Math.min(CYCLES, Math.floor(tick / CYCLE) + 1);
  const pos = tick % CYCLE;
  const scale =
    pos < INHALE
      ? 0.72 + (pos / INHALE) * 0.4
      : pos < INHALE + HOLD
        ? 1.12
        : 1.12 - ((pos - INHALE - HOLD) / EXHALE) * 0.4;

  const finish = async () => {
    if (saving) return;
    setSaving(true);
    if (taskId) await markTaskDone(day, taskId);
    router.push("/journal");
  };

  return (
    <main className="practice-page practice-page--breathing">
      <AppNav day={day} />
      <section className="practice-stage">
        <Link href="/journal" className="practice-back">
          ← 回到主界面
        </Link>
        <div className="practice-host">
          <XiaoyuAvatar variant="host" size="md" />
          <div>
            <span className="eyebrow">BREATHE · 约 2 分钟</span>
            <h1>呼吸练习</h1>
            <p>跟着圆圈：吸 4 · 停 2 · 呼 6。身体会自己慢慢松开。</p>
          </div>
        </div>

        <div className="practice-orb-wrap" aria-hidden="true">
          <div
            className={`practice-orb practice-orb--breath ${phase === "running" ? "is-active" : ""}`}
            style={{ transform: `scale(${phase === "running" ? scale : 0.85})` }}
          />
        </div>

        {phase === "ready" && (
          <div className="practice-copy fade-up">
            <p>找一个安静的位置。肩膀放下一点，就可以开始了。</p>
            <button type="button" className="practice-cta" onClick={() => setPhase("running")}>
              开始呼吸 →
            </button>
          </div>
        )}

        {phase === "running" && (
          <div className="practice-copy fade-up">
            <p className="practice-guide practice-guide--lg">{label.word}</p>
            <small>{label.hint} · 第 {cycleIndex}/{CYCLES} 轮</small>
            <button type="button" className="practice-ghost" onClick={() => setPhase("done")}>
              我想提前结束
            </button>
          </div>
        )}

        {phase === "done" && (
          <div className="practice-copy fade-up">
            <p className="practice-guide">呼气已经把一点紧绷带走了。可以回去继续今天的纸卷。</p>
            <button type="button" className="practice-cta" onClick={finish} disabled={saving}>
              {saving ? "正在记下…" : taskId ? "完成，回到今日纸卷 →" : "回到主界面 →"}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
