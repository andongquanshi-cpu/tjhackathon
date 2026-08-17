"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import AppNav from "@/components/AppNav";
import XiaoyuAvatar from "@/components/XiaoyuAvatar";

type Phase = "ready" | "running" | "done";

const STEPS = [
  { at: 0, text: "先找一个舒服的姿势。不必完美，只要身体愿意待一会儿。" },
  { at: 15, text: "把注意力轻轻放到呼吸上——吸气，呼气。走神了也没关系。" },
  { at: 45, text: "如果念头飘走，温柔地把它带回这一次呼吸就好。" },
  { at: 90, text: "留意身体里有没有紧的地方。不必改变它，只是看见。" },
  { at: 130, text: "再留三次完整的呼吸，然后慢慢睁开眼睛。" },
];

const TOTAL_SECONDS = 150;

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
    // 完成态保存失败不挡回主界面
  }
}

export default function MeditationPracticePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const day = Number(searchParams.get("day") || "1");
  const taskId = searchParams.get("task");
  const [phase, setPhase] = useState<Phase>("ready");
  const [elapsed, setElapsed] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (phase !== "running") return;
    const timer = window.setInterval(() => {
      setElapsed((value) => {
        if (value + 1 >= TOTAL_SECONDS) {
          window.clearInterval(timer);
          setPhase("done");
          return TOTAL_SECONDS;
        }
        return value + 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  const guideText = useMemo(() => {
    let text = STEPS[0].text;
    for (const step of STEPS) {
      if (elapsed >= step.at) text = step.text;
    }
    return text;
  }, [elapsed]);

  const progress = Math.min(100, (elapsed / TOTAL_SECONDS) * 100);
  const remaining = Math.max(0, TOTAL_SECONDS - elapsed);

  const finish = async () => {
    if (saving) return;
    setSaving(true);
    if (taskId) await markTaskDone(day, taskId);
    router.push("/journal");
  };

  return (
    <main className="practice-page practice-page--meditation">
      <AppNav day={day} />
      <section className="practice-stage">
        <Link href="/journal" className="practice-back">
          ← 回到主界面
        </Link>
        <div className="practice-host">
          <XiaoyuAvatar variant="host" size="md" />
          <div>
            <span className="eyebrow">MINDFULNESS · 约 2.5 分钟</span>
            <h1>正念冥想</h1>
            <p>小愈会陪你把注意力一点点带回当下。走神很正常，回来就好。</p>
          </div>
        </div>

        <div className="practice-orb-wrap" aria-hidden="true">
          <div
            className={`practice-orb ${phase === "running" ? "is-breathing" : ""} ${phase === "done" ? "is-done" : ""}`}
            style={{ "--progress": `${progress}%` } as CSSProperties}
          />
        </div>

        {phase === "ready" && (
          <div className="practice-copy fade-up">
            <p>准备好了吗？接下来大约两分半。你可以闭眼，也可以半睁着眼。</p>
            <button type="button" className="practice-cta" onClick={() => setPhase("running")}>
              开始练习 →
            </button>
          </div>
        )}

        {phase === "running" && (
          <div className="practice-copy fade-up">
            <p className="practice-guide">{guideText}</p>
            <div className="practice-meter" style={{ "--meter": `${progress}%` } as CSSProperties}>
              <span>{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</span>
              <i />
            </div>
            <button type="button" className="practice-ghost" onClick={() => setPhase("done")}>
              我想提前结束
            </button>
          </div>
        )}

        {phase === "done" && (
          <div className="practice-copy fade-up">
            <p className="practice-guide">很好。这一段时间，已经属于你自己了。</p>
            <button type="button" className="practice-cta" onClick={finish} disabled={saving}>
              {saving ? "正在记下…" : taskId ? "完成，回到今日纸卷 →" : "回到主界面 →"}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
