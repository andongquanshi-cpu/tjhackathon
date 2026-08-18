"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import AppNav from "@/components/AppNav";
import XiaoyuAvatar from "@/components/XiaoyuAvatar";

type Phase = "ready" | "running" | "done";

const TARGET = 21;

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

function playKnock(ctx: AudioContext) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(240, t);
  osc.frequency.exponentialRampToValueAtTime(88, t + 0.09);
  filter.type = "lowpass";
  filter.frequency.value = 920;
  gain.gain.setValueAtTime(0.26, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.22);

  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.035), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / 180);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const ng = ctx.createGain();
  const nf = ctx.createBiquadFilter();
  nf.type = "bandpass";
  nf.frequency.value = 1280;
  ng.gain.setValueAtTime(0.16, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
  noise.connect(nf);
  nf.connect(ng);
  ng.connect(ctx.destination);
  noise.start(t);
}

export default function WoodfishPracticePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const day = Number(searchParams.get("day") || "1");
  const taskId = searchParams.get("task");
  const audioRef = useRef<AudioContext | null>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [wish, setWish] = useState("");
  const [keptWish, setKeptWish] = useState("");
  const [count, setCount] = useState(0);
  const [struck, setStruck] = useState(false);
  const [saving, setSaving] = useState(false);

  const ensureAudio = async () => {
    const AudioCtx =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioRef.current) audioRef.current = new AudioCtx();
    if (audioRef.current.state === "suspended") await audioRef.current.resume();
    return audioRef.current;
  };

  const knock = async () => {
    if (phase !== "running") return;
    const ctx = await ensureAudio();
    if (ctx) playKnock(ctx);
    setStruck(true);
    window.setTimeout(() => setStruck(false), 180);
    setCount((value) => value + 1);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== "Space" && event.key !== " ") return;
      if (phase !== "running") return;
      event.preventDefault();
      void knock();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  const start = async () => {
    setKeptWish(wish.trim());
    setCount(0);
    await ensureAudio();
    setPhase("running");
  };

  const finish = async () => {
    if (saving) return;
    setSaving(true);
    audioRef.current?.close().catch(() => undefined);
    if (taskId) await markTaskDone(day, taskId);
    router.push("/journal");
  };

  return (
    <main className="practice-page practice-page--woodfish">
      <AppNav day={day} />
      <section className="practice-stage">
        <Link href="/journal" className="practice-back">
          ← 回到主界面
        </Link>
        <div className="practice-host">
          <XiaoyuAvatar variant="host" size="md" />
          <div>
            <span className="eyebrow">GENTLE WISH · 慢慢敲</span>
            <h1>木鱼祈愿</h1>
            <p>把一份小小的心愿放在手里。跟着缓慢节奏轻敲，不必赶，敲到心里安静一点就好。</p>
          </div>
        </div>

        {phase === "ready" && (
          <div className="practice-copy fade-up woodfish-ready">
            <label className="woodfish-wish">
              <span>这一刻，你想轻轻放下的是？</span>
              <input
                value={wish}
                onChange={(event) => setWish(event.target.value.slice(0, 32))}
                placeholder="也可以先不写，只是来敲几下"
                maxLength={32}
              />
            </label>
            <button type="button" className="practice-cta" onClick={start}>
              开始祈愿 →
            </button>
          </div>
        )}

        {phase === "running" && (
          <div className="practice-copy fade-up woodfish-running">
            {keptWish && <p className="woodfish-slip">「{keptWish}」</p>}
            <button
              type="button"
              className={`woodfish ${struck ? "is-struck" : ""}`}
              onClick={knock}
              aria-label="敲一下木鱼"
            >
              <span className="woodfish__ripple" />
              <span className="woodfish__ripple is-late" />
              <svg className="woodfish__body" viewBox="0 0 220 180" aria-hidden="true">
                <ellipse cx="110" cy="108" rx="86" ry="52" fill="#c8924a" />
                <ellipse cx="110" cy="98" rx="78" ry="46" fill="#e0ae66" />
                <path d="M42 108c18-22 48-34 68-34s50 12 68 34" fill="none" stroke="#8a5a28" strokeWidth="3.2" />
                <path d="M58 92c12-8 28-12 52-12s40 4 52 12" fill="none" stroke="#f4d7a1" strokeWidth="2" opacity=".7" />
                <ellipse cx="82" cy="96" rx="7" ry="9" fill="#3c2412" />
                <ellipse cx="138" cy="96" rx="7" ry="9" fill="#3c2412" />
                <path d="M98 118c8 8 16 8 24 0" fill="none" stroke="#7a4a22" strokeWidth="3" strokeLinecap="round" />
                <path d="M168 64c18-18 38-8 42 10 2 10-6 18-16 20" fill="#c8924a" stroke="#7a4a22" strokeWidth="3" />
                <circle cx="198" cy="78" r="5" fill="#e0ae66" />
              </svg>
              <span className={`woodfish__mallet ${struck ? "is-down" : ""}`} aria-hidden="true" />
            </button>
            <p className="practice-guide">{count === 0 ? "点一下木鱼，或按空格。" : `已轻轻敲了 ${count} 下`}</p>
            <small>{count >= TARGET ? "够了也可以停。心里安静一点，就可以放下。" : `慢慢来，大约 ${TARGET} 下就好，多几下也没关系。`}</small>
            <button type="button" className="practice-ghost" onClick={() => setPhase("done")}>
              {count > 0 ? "我想先停在这里" : "先不敲了"}
            </button>
          </div>
        )}

        {phase === "done" && (
          <div className="practice-copy fade-up">
            <p className="practice-guide">
              {count > 0
                ? `这 ${count} 下已经够了。心愿不必立刻实现，先让它安静地待一会儿。`
                : "你来过这里就很好。心愿可以下次再放下。"}
            </p>
            <button type="button" className="practice-cta" onClick={finish} disabled={saving}>
              {saving ? "正在记下…" : taskId ? "完成，回到今日纸卷 →" : "回到主界面 →"}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
