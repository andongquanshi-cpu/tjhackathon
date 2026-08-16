"use client";

import { useState } from "react";
import Link from "next/link";
import type { DailyGuideProgress } from "@/lib/types";
import type { DailyGuide } from "@/lib/prompts";
import XiaoyuAvatar from "./XiaoyuAvatar";

export default function DailyGuideView({
  guide,
  initialProgress,
  currentDay,
}: {
  guide: DailyGuide;
  initialProgress: DailyGuideProgress | null;
  currentDay: number;
}) {
  const [completed, setCompleted] = useState(initialProgress?.completedTaskIds ?? []);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const allDone = completed.length === guide.tasks.length;

  const toggleTask = async (taskId: string) => {
    const next = completed.includes(taskId)
      ? completed.filter((id) => id !== taskId)
      : [...completed, taskId];
    setCompleted(next);
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/guides/${guide.day}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedTaskIds: next }),
      });
      if (!response.ok) throw new Error("save failed");
      if (next.length === guide.tasks.length) setMessage("今天的导单已经完成。让它慢慢发生，不需要做得完美。");
    } catch {
      setCompleted(completed);
      setMessage("保存失败，请稍后再试。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="guide-layout">
      <aside className="guide-sidebar">
        <span className="eyebrow">21 DAYS PRACTICE</span>
        <div className="guide-day-number">{String(guide.day).padStart(2, "0")}</div>
        <h1>{guide.theme}</h1>
        <p>{guide.subtitle}</p>
        <div className="guide-progress-ring" style={{ "--progress": `${(completed.length / guide.tasks.length) * 100}%` } as React.CSSProperties}>
          <span>{completed.length}/{guide.tasks.length}</span>
        </div>
        <div className="guide-day-nav">
          {guide.day > 1 && <Link href={`/guide?day=${guide.day - 1}`}>← 前一天</Link>}
          {guide.day < 21 && <Link href={`/guide?day=${guide.day + 1}`}>后一天 →</Link>}
        </div>
      </aside>

      <section className="guide-content">
        <div className="guide-host">
          <XiaoyuAvatar variant="host" size="sm" />
          <p>
            {guide.day === currentDay
              ? "这是今天的练习。你可以按自己的节奏完成，也可以只选最需要的一项。"
              : `你正在查看第 ${guide.day} 天的导单，完成状态会被保留下来。`}
          </p>
        </div>

        <div className="guide-tasks">
          {guide.tasks.map((task, index) => {
            const checked = completed.includes(task.id);
            return (
              <button
                key={task.id}
                onClick={() => toggleTask(task.id)}
                disabled={saving}
                className={`guide-task ${checked ? "is-complete" : ""}`}
              >
                <span className="guide-task-index">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <span className="eyebrow">{task.part} · {task.duration}</span>
                  <h2>{task.title}</h2>
                  <p>{task.description}</p>
                </div>
                <span className="task-check">{checked ? "已完成" : "标记完成"}</span>
              </button>
            );
          })}
        </div>

        {message && <div className={`guide-message ${allDone ? "is-success" : ""}`}>{message}</div>}
        <footer className="guide-footer">
          <Link href="/journal">返回主界面</Link>
          <Link href="/calendar" className="primary-pill">在月历中查看进度 →</Link>
        </footer>
      </section>
    </div>
  );
}
