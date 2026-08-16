"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Note, Profile } from "@/lib/types";
import { dailyGuide } from "@/lib/prompts";
import XiaoyuAvatar from "@/components/XiaoyuAvatar";
import AppNav from "@/components/AppNav";

const MOOD = [
  { v: 1, e: "阴", label: "低落" },
  { v: 2, e: "倦", label: "疲惫" },
  { v: 3, e: "平", label: "平稳" },
  { v: 4, e: "暖", label: "不错" },
  { v: 5, e: "晴", label: "晴朗" },
];

export default function JournalPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [content, setContent] = useState("");
  const [mood, setMood] = useState(3);
  const [saving, setSaving] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [error, setError] = useState("");
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [ready, setReady] = useState(false);
  const [showFirstGuide, setShowFirstGuide] = useState(false);
  const [scrollOpen, setScrollOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const [notesRes, profileRes] = await Promise.all([
        fetch("/api/notes"),
        fetch("/api/profile"),
      ]);
      const [notesData, profileData] = await Promise.all([notesRes.json(), profileRes.json()]);
      setNotes(notesData.notes ?? []);
      setProfile(profileData.profile ?? null);
      if (!profileData.profile && !window.localStorage.getItem("yuxingxiang-journal-intro-seen")) {
        setShowFirstGuide(true);
      }
      setReady(true);
    })();
  }, []);

  const save = async () => {
    if (!content.trim() || saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), mood }),
      });
      const data = await res.json();
      if (data.note) {
        setPrompt(data.note.prompt ?? "");
        router.push(`/notes/${data.note.id}`);
      } else {
        setError(data.error ?? "记录没有保存成功");
      }
    } catch {
      setError("网络似乎走神了，请稍后重试");
    } finally {
      setSaving(false);
    }
  };

  const sorted = [...notes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const day = profile
    ? Math.min(21, Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / 86_400_000) + 1)
    : 1;
  const guide = dailyGuide(day);
  const dismissFirstGuide = () => {
    window.localStorage.setItem("yuxingxiang-journal-intro-seen", "true");
    setShowFirstGuide(false);
  };

  return (
    <main className="journey-dashboard">
      <AppNav day={day} />

      <div className="journey-dashboard__layout">
        <aside className="journey-dashboard__records">
          <div className="journey-dashboard__heading">
            <span className="eyebrow">TODAY&apos;S RECORD</span>
            <h1>记录此刻</h1>
            <p>不必完整，一句话也能成为圆桌会谈的开始。</p>
          </div>
          <button onClick={() => setComposerOpen(true)} className="journey-dashboard__add" aria-label="写下新的记录">
            <span>＋</span>
            <small>写下一句</small>
          </button>
          <div className="journey-dashboard__record-list">
            {sorted.length === 0 && <p>还没有记录。按下加号，让今天被听见。</p>}
            {sorted.map((note) => (
              <Link key={note.id} href={`/notes/${note.id}`} className="journey-dashboard__record">
                <span>DAY {note.day}</span>
                <p>{note.content}</p>
                <b>{note.feedback ? "查看反馈" : note.comments ? "继续圆桌" : "进入圆桌"} →</b>
              </Link>
            ))}
          </div>

          {sorted[0]?.risk && !alertDismissed && (
            <div className={`mentor-alert alert-${sorted[0].risk.level}`}>
              <XiaoyuAvatar variant={sorted[0].risk.level === "gentle" ? "humanistic" : "host"} size="sm" />
              <div>
                <strong>{sorted[0].risk.title}</strong>
                <p>{sorted[0].risk.message}</p>
                {sorted[0].risk.resources?.map((resource) => <small key={resource}>{resource}</small>)}
                <div className="mentor-alert-actions">
                  <Link href={`/notes/${sorted[0].id}`}>查看这条记录</Link>
                  <button onClick={() => setAlertDismissed(true)}>稍后再看</button>
                </div>
              </div>
            </div>
          )}

          <div className="journey-dashboard__mentor-stack" aria-label="四位导师">
            {[
              ["humanistic", "暖"],
              ["psychodynamic", "镜"],
              ["cognitive", "思"],
              ["postmodern", "叙"],
            ].map(([variant, label], index) => (
              <div key={variant} className={`journey-dashboard__mentor journey-dashboard__mentor--${index + 1}`}>
                <XiaoyuAvatar variant={variant as "humanistic" | "psychodynamic" | "cognitive" | "postmodern"} size="sm" />
                <span>{label}</span>
              </div>
            ))}
            <p>“今天想从哪个感受开始聊起？”</p>
          </div>
        </aside>

        <section className="journey-dashboard__main">
          <button
            type="button"
            className={`journey-dashboard__hanging ${scrollOpen ? "is-down" : ""}`}
            onClick={() => setScrollOpen((open) => !open)}
            aria-expanded={scrollOpen}
          >
            <span className="journey-dashboard__rope" />
            <XiaoyuAvatar variant="host" size="md" />
            <span className="journey-dashboard__hanging-hint">{scrollOpen ? "收起今日小事" : "点我看看今天能做什么"}</span>
          </button>
          {scrollOpen && (
            <aside className="journey-dashboard__scroll fade-up">
              <span>小愈带来的今日纸卷</span>
              <strong>DAY {String(day).padStart(2, "0")} · {guide.theme}</strong>
              <ol>
                {guide.tasks.map((task) => <li key={task.id}>{task.title}<small>{task.duration}</small></li>)}
              </ol>
              <Link href={`/guide?day=${day}`}>去完成今日导单 →</Link>
            </aside>
          )}

          <section className="journey-dashboard__card journey-dashboard__assessment">
            <span className="eyebrow">INNER COMPASS</span>
            <div>
              <h2>测量量表</h2>
              <p>{profile ? "你的初始测量已完成。可以随时回看它留下的内心画像。" : "用一份小表格，为这段旅程找到开始的位置。"}</p>
            </div>
            {profile ? (
              <Link href="/profile" className="journey-dashboard__text-link">查看我的画像 →</Link>
            ) : (
              <Link href="/assessment" className="journey-dashboard__card-button">开始测量 →</Link>
            )}
          </section>

          <section className="journey-dashboard__card journey-dashboard__mindfulness">
            <span className="eyebrow">MINDFULNESS MOMENT</span>
            <div>
              <h2>冥想与正念</h2>
              <p>今天的主题是「{guide.theme}」。用几分钟，回到呼吸、身体和当下。</p>
            </div>
            <Link href={`/guide?day=${day}`} className="journey-dashboard__card-button">立即开始 →</Link>
          </section>

          <Link href={`/calendar/${day}`} className="journey-dashboard__generate">
            <span>
              <small>GENERATE TODAY&apos;S FORM</small>
              <b>生成今日总结表单</b>
            </span>
            <i>↗</i>
          </Link>
        </section>
      </div>

      {ready && showFirstGuide && (
        <div className="journey-dashboard__intro-backdrop" role="dialog" aria-modal="true" aria-labelledby="first-guide-title">
          <section className="journey-dashboard__intro">
            <XiaoyuAvatar variant="host" size="sm" />
            <span className="eyebrow">FIRST VISIT</span>
            <h2 id="first-guide-title">第 1 次来吗？<br />要不要先做一个小表格？</h2>
            <p>它能帮小愈更好地陪你开始这 21 天。不会给你贴标签，也可以之后再做。</p>
            <div>
              <Link href="/assessment" onClick={dismissFirstGuide} className="journey-dashboard__card-button">去做小表格 →</Link>
              <button type="button" onClick={dismissFirstGuide}>我想先随便看看</button>
            </div>
          </section>
        </div>
      )}

      {composerOpen && (
        <div className="composer-backdrop" role="dialog" aria-modal="true" aria-label="新建记录">
          <div className="composer-sheet">
            <button onClick={() => setComposerOpen(false)} className="composer-close">关闭 ×</button>
            <span className="eyebrow">TODAY&apos;S NOTE</span>
            <h2>此刻，你最想写下什么？</h2>
            <p>{prompt || "不必完整，也不必正确。一句话就可以开始。"}</p>
            <textarea
              autoFocus
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={7}
              placeholder="把这一刻的感受、念头或小事写下来……"
            />
            <div className="composer-footer">
              <div className="mood-picker">
                {MOOD.map((item) => (
                  <button
                    key={item.v}
                    onClick={() => setMood(item.v)}
                    title={item.label}
                    className={mood === item.v ? "is-active" : ""}
                  >
                    {item.e}
                  </button>
                ))}
              </div>
              <button onClick={save} disabled={!content.trim() || saving} className="primary-pill">
                {saving ? "正在保存…" : "邀请导师入席 →"}
              </button>
            </div>
            {error && <p className="mt-4 text-sm text-rose-700">{error}</p>}
          </div>
        </div>
      )}
    </main>
  );
}