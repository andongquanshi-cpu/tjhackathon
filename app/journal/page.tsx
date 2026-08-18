"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { DailyGuideProgress, Note, Profile } from "@/lib/types";
import { SCHOOLS } from "@/lib/personas";
import { dailyGuide } from "@/lib/prompts";
import { FEATURE_MODULES, guideTaskAction, practiceHref } from "@/lib/practice";
import XiaoyuAvatar from "@/components/XiaoyuAvatar";
import MentorMeetPanel from "@/components/MentorMeetPanel";
import AppNav from "@/components/AppNav";
import { MOOD_OPTIONS } from "@/lib/moods";

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
  const [toolsOpen, setToolsOpen] = useState(false);
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

      <div className={`journey-dashboard__layout ${toolsOpen ? "is-tools-open" : ""}`}>
        <section className="journey-dashboard__roundtable journey-dashboard__meet" aria-label="圆桌时刻">
          <header className="journey-dashboard__hero">
            <div>
              <h1>
                <b>CURE</b> room ——圆桌时刻
              </h1>
            </div>
          </header>

          <MentorMeetPanel mentors={SCHOOLS} className="journey-dashboard__mentor-meet" />

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

          <button
            onClick={() => setComposerOpen(true)}
            className="journey-dashboard__add"
            aria-label="记下这一刻并进入圆桌"
          >
            <span aria-hidden="true">＋</span>
            <div className="journey-dashboard__add-copy">
              <b>记下这一刻</b>
            </div>
            <img
              className="journey-dashboard__add-decor"
              src="/decor/ball-hand-in-hand.png"
              alt=""
              aria-hidden="true"
              draggable={false}
            />
          </button>
        </section>

        <aside className="journey-dashboard__history" aria-label="历史记录">
          <div className="journey-dashboard__history-head">
            <span className="eyebrow">HISTORY</span>
            <h2>历史记录</h2>
            <p>{sorted.length} 条 · 点击继续圆桌</p>
          </div>

          <div className="journey-dashboard__record-list">
            {sorted.length === 0 && (
              <p className="journey-dashboard__empty">还没有记录。先从左侧记下这一刻开始。</p>
            )}
            {sorted.map((note) => (
              <Link key={note.id} href={`/notes/${note.id}`} className="journey-dashboard__record">
                <span>DAY {note.day}</span>
                <p>{note.content}</p>
                <b>{note.feedback ? "反馈" : note.comments ? "继续" : "圆桌"} →</b>
              </Link>
            ))}
          </div>

          <div className={`journey-dashboard__pulldown ${todoOpen ? "is-open" : ""}`}>
            <div className="journey-dashboard__pulldown-sheet">
              <button
                type="button"
                className="journey-dashboard__pulldown-handle"
                onClick={() => setTodoOpen((open) => !open)}
                aria-expanded={todoOpen}
              >
                <span className="journey-dashboard__pulldown-line" aria-hidden="true" />
                <XiaoyuAvatar variant="host" size="md" />
                <span className="journey-dashboard__pulldown-hint">
                  {todoOpen ? "收起今日小事" : "点我展开今日待办"}
                </span>
              </button>

              <div className="journey-dashboard__pulldown-body">
                <aside
                  className="journey-dashboard__todo"
                  aria-label="今日待办"
                  aria-hidden={!todoOpen}
                >
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
              </div>
            </div>
          </div>
        </aside>

        <aside className={`journey-dashboard__tools ${toolsOpen ? "is-open" : ""}`} aria-label="练习工具">
          <button
            type="button"
            className="journey-dashboard__tools-toggle"
            onClick={() => setToolsOpen((open) => !open)}
            aria-expanded={toolsOpen}
          >
            <span>{toolsOpen ? "收起" : "练习"}</span>
            <i>{toolsOpen ? "›" : "‹"}</i>
          </button>
          <div className="journey-dashboard__tools-rail">
            <p className="journey-dashboard__tools-label">TOOLS</p>
            {FEATURE_MODULES.map((feature) => {
              if (feature.available) {
                return (
                  <Link
                    key={feature.id}
                    href={practiceHref(feature.id, day)}
                    className={`journey-dashboard__tool journey-dashboard__tool--${feature.id}`}
                    title={feature.title}
                  >
                    <strong>{feature.title.slice(0, 2)}</strong>
                    <small>{feature.title}</small>
                  </Link>
                );
              }
              return (
                <button
                  key={feature.id}
                  type="button"
                  className={`journey-dashboard__tool journey-dashboard__tool--${feature.id} is-soon`}
                  disabled
                  title={`${feature.title} · 即将开放`}
                >
                  <strong>{feature.title.slice(0, 2)}</strong>
                  <small>{feature.title}</small>
                  <em>即将</em>
                </button>
              );
            })}
          </div>
          <div className="journey-dashboard__tools-panel">
            <span className="eyebrow">SIDEBAR</span>
            <h3>练习工具</h3>
            <p>主路径是圆桌。需要放松时，从这里或今日小事跳进来。</p>
            <div className="journey-dashboard__tools-list">
              {FEATURE_MODULES.map((feature) => (
                <div key={feature.id} className={`journey-dashboard__tool-card journey-dashboard__tool-card--${feature.id}`}>
                  <span>{feature.eyebrow}</span>
                  <strong>{feature.title}</strong>
                  <p>{feature.description}</p>
                  {feature.available ? (
                    <Link href={practiceHref(feature.id, day)}>开始 →</Link>
                  ) : (
                    <em>即将开放</em>
                  )}
                </div>
              ))}
            </div>
          </div>
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
              <div className="mood-picker-wrap">
                <span className="mood-tag" aria-hidden="true">
                  心情 tag
                  <em>{MOOD_OPTIONS.find((item) => item.value === mood)?.label ?? "平稳"}</em>
                </span>
                <div className="mood-picker" role="group" aria-label="此刻的心情天气">
                  {MOOD_OPTIONS.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setMood(item.value)}
                      title={`${item.mark} · ${item.label}（${item.weather}）`}
                      aria-label={`${item.mark}，${item.label}`}
                      aria-pressed={mood === item.value}
                      className={mood === item.value ? "is-active" : ""}
                    >
                      <img src={item.icon} alt="" draggable={false} />
                      <span>{item.mark}</span>
                    </button>
                  ))}
                </div>
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
