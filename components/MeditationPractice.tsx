"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
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

const FALLBACK_SECONDS = 150;
const VIDEO_URL = process.env.NEXT_PUBLIC_MEDITATION_VIDEO_URL?.trim() ?? "";

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasVideo = Boolean(VIDEO_URL);

  const [phase, setPhase] = useState<Phase>("ready");
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(FALLBACK_SECONDS);
  const [saving, setSaving] = useState(false);
  const [videoError, setVideoError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!VIDEO_URL) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(VIDEO_URL, { method: "HEAD", mode: "cors" });
        if (cancelled) return;
        if (!res.ok) {
          setLoadFailed(true);
          setVideoError(
            res.status === 403
              ? "视频链接已失效（OSS 403）。请重新复制公共读地址，或换一条新的签名链接写入 .env.local。"
              : `视频无法访问（HTTP ${res.status}）。请检查 OSS 权限与链接。`
          );
        }
      } catch {
        if (cancelled) return;
        // HEAD/CORS 失败时仍交给 <video> 试播；真正失败会走 onError
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (hasVideo || phase !== "running") return;
    const timer = window.setInterval(() => {
      setElapsed((value) => {
        if (value + 1 >= FALLBACK_SECONDS) {
          window.clearInterval(timer);
          setPhase("done");
          return FALLBACK_SECONDS;
        }
        return value + 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase, hasVideo]);

  const guideText = useMemo(() => {
    let text = STEPS[0].text;
    for (const step of STEPS) {
      if (elapsed >= step.at) text = step.text;
    }
    return text;
  }, [elapsed]);

  const total = hasVideo ? Math.max(duration, 1) : FALLBACK_SECONDS;
  const progress = Math.min(100, (elapsed / total) * 100);
  const remaining = Math.max(0, Math.round(total - elapsed));

  const start = async () => {
    setVideoError("");
    setElapsed(0);
    if (hasVideo) {
      const video = videoRef.current;
      if (!video) {
        setVideoError("播放器还没准备好，请再点一次开始。");
        return;
      }
      try {
        // 必须在点击回调里直接 play，浏览器才允许带声音播放
        video.currentTime = 0;
        await video.play();
        setPhase("running");
      } catch {
        setPhase("running");
        setVideoError("请直接点击下方视频中间的播放按钮开始。");
      }
      return;
    }
    setPhase("running");
  };

  const finish = async () => {
    if (saving) return;
    setSaving(true);
    videoRef.current?.pause();
    if (taskId) await markTaskDone(day, taskId);
    router.push("/journal");
  };

  const endEarly = () => {
    videoRef.current?.pause();
    setPhase("done");
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
            <span className="eyebrow">MINDFULNESS · 小愈陪你</span>
            <h1>正念冥想</h1>
            <p>
              {hasVideo
                ? "跟着视频，把注意力一点点带回当下。走神很正常，回来就好。"
                : "小愈会陪你把注意力一点点带回当下。走神很正常，回来就好。"}
            </p>
          </div>
        </div>

        {hasVideo ? (
          <div className={`practice-video-shell ${phase === "ready" ? "is-ready" : ""}`}>
            <video
              ref={videoRef}
              className="practice-video"
              src={VIDEO_URL}
              playsInline
              preload="auto"
              controls
              onLoadedMetadata={(event) => {
                const next = event.currentTarget.duration;
                if (Number.isFinite(next) && next > 0) setDuration(next);
              }}
              onTimeUpdate={(event) => setElapsed(event.currentTarget.currentTime)}
              onPlay={() => {
                setVideoError("");
                setPhase((current) => (current === "ready" ? "running" : current));
              }}
              onEnded={() => setPhase("done")}
              onError={() => {
                setLoadFailed(true);
                setVideoError(
                  "视频加载失败。常见原因：OSS 仍是私有、签名过期、或未配置 CORS。请改用公共读的干净 https 地址。"
                );
              }}
            />
            {phase === "ready" && !loadFailed && (
              <button type="button" className="practice-video-mask" onClick={start}>
                <p>点击开始播放</p>
              </button>
            )}
            {loadFailed && (
              <div className="practice-video-mask practice-video-mask--error">
                <p>视频暂时无法播放</p>
              </div>
            )}
          </div>
        ) : (
          <div className="practice-orb-wrap" aria-hidden="true">
            <div
              className={`practice-orb ${phase === "running" ? "is-breathing" : ""} ${phase === "done" ? "is-done" : ""}`}
              style={{ "--progress": `${progress}%` } as CSSProperties}
            />
          </div>
        )}

        {phase === "ready" && (
          <div className="practice-copy fade-up">
            <p>
              {hasVideo
                ? "点开始后会播放小愈冥想视频。可以戴上耳机，找一个舒服的姿势。"
                : "准备好了吗？接下来大约两分半。你可以闭眼，也可以半睁着眼。"}
            </p>
            <button type="button" className="practice-cta" onClick={start}>
              开始练习 →
            </button>
          </div>
        )}

        {phase === "running" && (
          <div className="practice-copy fade-up">
            {!hasVideo && <p className="practice-guide">{guideText}</p>}
            {hasVideo && <p className="practice-guide">跟着画面与声音就好，不必追求完美。</p>}
            <div className="practice-meter" style={{ "--meter": `${progress}%` } as CSSProperties}>
              <span>
                {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}
              </span>
              <i />
            </div>
            {videoError && <p className="practice-error">{videoError}</p>}
            <button type="button" className="practice-ghost" onClick={endEarly}>
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
