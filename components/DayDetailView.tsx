"use client";

import { useState } from "react";
import Link from "next/link";
import type { DailyGuideProgress, Note } from "@/lib/types";
import { isSessionFeedbackV2 } from "@/lib/types";
import type { DailyGuide } from "@/lib/prompts";
import XiaoyuAvatar from "./XiaoyuAvatar";

export default function DayDetailView({
  day,
  dateLabel,
  notes,
  guide,
  progress,
}: {
  day: number;
  dateLabel: string;
  notes: Note[];
  guide: DailyGuide;
  progress: DailyGuideProgress | null;
}) {
  const [insightOpen, setInsightOpen] = useState(false);
  const latest = notes[notes.length - 1];
  const completed = progress?.completedTaskIds.length ?? 0;

  return (
    <section className="day-detail-layout">
      <aside className="day-detail-meta">
        <Link href="/journal">← 返回主界面</Link>
        <span className="eyebrow">DAILY REFLECTION · DAY {day}</span>
        <h1>{dateLabel}</h1>
        <p>每日总结表单 · {guide.theme} · {guide.subtitle}</p>
        <button onClick={() => setInsightOpen((value) => !value)} className="xiaoyu-insight-trigger">
          <XiaoyuAvatar variant="host" size="lg" />
          <span>{insightOpen ? "收起小愈的观察" : "点击小愈，看这一天的细节"}</span>
        </button>
      </aside>

      <article className="day-detail-paper">
        <header className="day-detail-form-heading">
          <span className="eyebrow">TODAY&apos;S FORM</span>
          <h2>把今天慢慢收进来</h2>
          <p>这里汇集了今天的练习、记录与圆桌回响。完成与否都没关系，留意到自己就已经很好。</p>
        </header>
        {insightOpen && (
          <div className="day-insight fade-up">
            <span className="eyebrow">小愈的观察</span>
            <p>
              {isSessionFeedbackV2(latest?.feedback)
                ? latest.feedback.xiaoyuNote
                : latest
                  ? `你在这一天留下了「${latest.content.slice(0, 54)}${latest.content.length > 54 ? "…" : ""}」。它已经成为这段旅程的一部分。`
                  : "这一天还没有留下文字。空白并不代表落后，你可以从今天补上一句，也可以允许它只是空白。"}
            </p>
          </div>
        )}

        <section className="day-section">
          <header><span className="eyebrow">DAILY GUIDE</span><b>{completed}/3</b></header>
          <h2>{guide.theme}</h2>
          <p>{guide.tasks[0].description}</p>
          <Link href="/journal">{completed === 3 ? "回主界面看今日纸卷" : "回主界面继续今日小事"} →</Link>
        </section>

        <section className="day-section">
          <header><span className="eyebrow">RECORDS</span><b>{notes.length}</b></header>
          {notes.length === 0 ? (
            <div className="day-empty">
              <p>这一天还没有记录。</p>
              <Link href="/journal">去主界面记下这一刻 →</Link>
            </div>
          ) : (
            <div className="day-note-list">
              {notes.map((note) => (
                <div key={note.id}>
                  <span>{new Date(note.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</span>
                  <p>{note.content}</p>
                  <div>
                    <Link href={`/notes/${note.id}`}>{note.comments ? "查看圆桌" : "进入圆桌"} →</Link>
                    {note.feedback && <Link href={`/notes/${note.id}/feedback`}>查看反馈 →</Link>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {isSessionFeedbackV2(latest?.feedback) && latest.feedback.suggestions.length > 0 && (
          <section className="day-section day-action">
            <span className="eyebrow">留给这一天的一小步</span>
            <p>{latest.feedback.suggestions[0]}</p>
          </section>
        )}
      </article>
    </section>
  );
}
