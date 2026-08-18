import Link from "next/link";
import { notFound } from "next/navigation";
import AppNav from "@/components/AppNav";
import XiaoyuAvatar from "@/components/XiaoyuAvatar";
import { isSessionFeedbackV2 } from "@/lib/types";
import { getNote } from "@/lib/store";

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const note = getNote(id);
  if (!note) notFound();

  if (!isSessionFeedbackV2(note.feedback)) {
    return (
      <main className="journey-dashboard feedback-page">
        <AppNav day={note.day} />
        <section className="feedback-shell">
          <XiaoyuAvatar variant="host" size="lg" />
          <h1>这份反馈还在整理中</h1>
          <p>回到圆桌点「结束圆桌，生成反馈」，小愈会按新版反馈单帮你收好这一页。</p>
          <Link href={`/notes/${id}`} className="primary-pill">
            返回圆桌 →
          </Link>
        </section>
      </main>
    );
  }

  const feedback = note.feedback;

  return (
    <main className="journey-dashboard feedback-page">
      <AppNav day={note.day} />

      <section className="feedback-layout">
        <aside>
          <XiaoyuAvatar variant="host" size="lg" />
          <span className="eyebrow">DAY {String(note.day).padStart(2, "0")} · XIAOYU&apos;S NOTE</span>
          <h1>把今天的这一页，轻轻收好。</h1>
        </aside>
        <article className="feedback-paper">
          <section className="feedback-block">
            <span className="eyebrow">01 · 时间</span>
            <p className="feedback-time">{feedback.timeRange}</p>
          </section>

          <section className="feedback-block">
            <span className="eyebrow">02 · 当时心情</span>
            <p className="feedback-mood">
              <b>{feedback.moodLabel}</b>
              <span>{feedback.moodSource === "ai" ? "由对话归纳" : "进入圆桌时选择"}</span>
            </p>
          </section>

          <section className="feedback-block">
            <span className="eyebrow">03 · 谈话内容</span>
            <div className="feedback-talk-list">
              {feedback.talkSummaries.map((item) => (
                <div key={`${item.school}-${item.mentorName}`} className="feedback-talk-item">
                  <b>{item.mentorName}</b>
                  <p>{item.summary}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="feedback-block">
            <span className="eyebrow">04 · 导师建议</span>
            <ol className="feedback-suggest-list">
              {feedback.suggestions.map((item, index) => (
                <li key={`${index}-${item.slice(0, 12)}`}>
                  <b>{String(index + 1).padStart(2, "0")}</b>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="feedback-block feedback-xiaoyu">
            <span className="eyebrow">05 · 小愈的话</span>
            <p>{feedback.xiaoyuNote}</p>
          </section>

          <div className="feedback-actions">
            <Link href={`/notes/${id}`}>回看本次对话</Link>
            <Link href="/journal" className="primary-pill">
              完成，返回主界面 →
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
