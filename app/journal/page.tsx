"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import type { DailyGuideProgress, Note, Profile, SchoolId } from "@/lib/types";
import { SCHOOLS } from "@/lib/personas";
import { MENTOR_DISPLAY } from "@/lib/mentors";
import { dailyGuide } from "@/lib/prompts";
import { guideTaskAction, practiceHref } from "@/lib/practice";
import XiaoyuAvatar from "@/components/XiaoyuAvatar";
import MentorPortrait from "@/components/MentorPortrait";
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
  const [todoOpen, setTodoOpen] = useState(true);
  const [selectedId, setSelectedId] = useState<SchoolId>(SCHOOLS[0].id);
  const [guideCompleted, setGuideCompleted] = useState<string[]>([]);
  const [guideSaving, setGuideSaving] = useState(false);
  const [guideMessage, setGuideMessage] = useState("");

  useEffect(() => {
    (async () => {
      const [notesRes, profileRes] = await Promise.all([
        fetch("/api/notes"),
        fetch("/api/profile"),
      ]);
      const [notesData, profileData] = await Promise.all([notesRes.json(), profileRes.json()]);
      setNotes(notesData.notes ?? []);
      setProfile(profileData.profile ?? null);
      const fetchedProfile = profileData.profile as Profile | null;
      const fetchedDay = fetchedProfile
        ? Math.min(21, Math.floor((Date.now() - new Date(fetchedProfile.createdAt).getTime()) / 86_400_000) + 1)
        : 1;
      const guideRes = await fetch(`/api/guides/${fetchedDay}/progress`);
      const guideData = await guideRes.json();
      setGuideCompleted((guideData.progress as DailyGuideProgress | null)?.completedTaskIds ?? []);
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
  const selectedInfo = MENTOR_DISPLAY[selectedId];
  const dismissFirstGuide = () => {
    window.localStorage.setItem("yuxingxiang-journal-intro-seen", "true");
    setShowFirstGuide(false);
  };
  const toggleGuideTask = async (taskId: string) => {
    if (guideSaving) return;
    const previous = guideCompleted;
    const next = previous.includes(taskId)
      ? previous.filter((id) => id !== taskId)
      : [...previous, taskId];
    setGuideCompleted(next);
    setGuideSaving(true);
    setGuideMessage("");
    try {
      const response = await fetch(`/api/guides/${day}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedTaskIds: next }),
      });
      if (!response.ok) throw new Error("save failed");
      if (next.length === guide.tasks.length) {
        setGuideMessage("今天的小事都完成了。已经很好，不需要做到完美。");
      }
    } catch {
      setGuideCompleted(previous);
      setGuideMessage("保存失败，请稍后再试。");
    } finally {
      setGuideSaving(false);
    }
  };

  const openTaskAction = (taskId: string) => {
    const action = guideTaskAction(taskId);
    if (action.kind === "compose") {
      setComposerOpen(true);
      return;
    }
    if (action.kind === "practice") {
      router.push(practiceHref(action.practiceId, day, taskId));
    }
  };

  return (
    <main className="journey-dashboard">
      <AppNav day={day} />

      <div className="journey-dashboard__layout">
        <section className="journey-dashboard__roundtable" aria-label="圆桌时刻">
          <header className="journey-dashboard__hero">
            <div>
              <span className="eyebrow">ROUNDTABLE MOMENT</span>
              <h1>圆桌时刻</h1>
              <p>写下这一刻，四位导师会与你围坐倾听。这是今天最主要的路径。</p>
            </div>
            <button
              onClick={() => setComposerOpen(true)}
              className="journey-dashboard__add"
              aria-label="写下新的记录并进入圆桌"
            >
              <span>＋</span>
              <div>
                <b>写下一句</b>
                <small>保存后直接进入圆桌会谈</small>
              </div>
            </button>
          </header>

          <div className="journey-dashboard__mentors" role="tablist" aria-label="四位导师">
            {SCHOOLS.map((mentor, index) => {
              const info = MENTOR_DISPLAY[mentor.id];
              const isSelected = mentor.id === selectedId;
              return (
                <button
                  key={mentor.id}
                  type="button"
                  className={`journey-dashboard__mentor-card ${isSelected ? "is-selected" : ""}`}
                  onClick={() => setSelectedId(mentor.id)}
                  role="tab"
                  aria-selected={isSelected}
                >
                  <span className="warm-home__number">0{index + 1}</span>
                  <MentorPortrait feature={info.feature} />
                  <strong>{mentor.name}</strong>
                  <small>{info.school}</small>
                </button>
              );
            })}
          </div>

          <article
            className="journey-dashboard__bubble warm-home__bubble"
            style={{ "--bubble-position": `${(SCHOOLS.findIndex((m) => m.id === selectedId) + 0.5) * 25}%` } as CSSProperties}
          >
            <span className="warm-home__bubble-tail" aria-hidden="true" />
            <div className="warm-home__bubble-mark">{selectedInfo.mark}</div>
            <div>
              <p className="warm-home__bubble-title">{selectedInfo.name}（{selectedInfo.school}）</p>
              <p>{selectedInfo.description}</p>
            </div>
          </article>

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
        </section>

        <aside className="journey-dashboard__history" aria-label="历史记录">
          <div className="journey-dashboard__history-head">
            <span className="eyebrow">HISTORY</span>
            <h2>历史记录</h2>
            <p>{sorted.length} 条 · 点击继续圆桌</p>
          </div>

          <div className="journey-dashboard__record-list">
            {sorted.length === 0 && (
              <p className="journey-dashboard__empty">还没有记录。先从左侧写下一句开始。</p>
            )}
            {sorted.map((note) => (
              <Link key={note.id} href={`/notes/${note.id}`} className="journey-dashboard__record">
                <span>DAY {note.day}</span>
                <p>{note.content}</p>
                <b>{note.feedback ? "反馈" : note.comments ? "继续" : "圆桌"} →</b>
              </Link>
            ))}
          </div>

          <button
            type="button"
            className={`journey-dashboard__hanging ${todoOpen ? "is-down" : ""}`}
            onClick={() => setTodoOpen((open) => !open)}
            aria-expanded={todoOpen}
          >
            <span className="journey-dashboard__rope" />
            <XiaoyuAvatar variant="host" size="md" />
            <span className="journey-dashboard__hanging-hint">{todoOpen ? "收起今日小事" : "点我展开今日待办"}</span>
          </button>

          {todoOpen && (
            <aside className="journey-dashboard__todo fade-up" aria-label="今日待办">
              <span>今日小事 · TODO</span>
              <div className="journey-dashboard__scroll-heading">
                <strong>DAY {String(day).padStart(2, "0")} · {guide.theme}</strong>
                <small>{guideCompleted.length}/{guide.tasks.length}</small>
              </div>
              <p>{guide.subtitle}</p>
              <div className="journey-dashboard__scroll-tasks">
                {guide.tasks.map((task) => {
                  const checked = guideCompleted.includes(task.id);
                  const action = guideTaskAction(task.id);
                  return (
                    <div
                      key={task.id}
                      className={`journey-dashboard__scroll-task ${checked ? "is-complete" : ""}`}
                    >
                      <button
                        type="button"
                        className="journey-dashboard__scroll-check"
                        onClick={() => toggleGuideTask(task.id)}
                        disabled={guideSaving}
                        aria-label={checked ? `取消完成：${task.title}` : `标记完成：${task.title}`}
                        aria-pressed={checked}
                      >
                        {checked ? "✓" : ""}
                      </button>
                      <button
                        type="button"
                        className="journey-dashboard__scroll-action"
                        onClick={() => openTaskAction(task.id)}
                      >
                        <b>{task.title}</b>
                        <small>{task.part} · {task.duration}</small>
                        <em>{task.hint ?? action.label}</em>
                        <span>{action.label} →</span>
                      </button>
                    </div>
                  );
                })}
              </div>
              {guideMessage && <p className="journey-dashboard__scroll-message">{guideMessage}</p>}
            </aside>
          )}
        </aside>
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
                {saving ? "正在保存…" : "写好了，听听回应 →"}
              </button>
            </div>
            {error && <p className="mt-4 text-sm text-rose-700">{error}</p>}
          </div>
        </div>
      )}
    </main>
  );
}
