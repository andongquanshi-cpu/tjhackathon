"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MENTOR_DISPLAY } from "@/lib/mentors";
import { MOOD_MARKS } from "@/lib/moods";
import { getSchool } from "@/lib/personas";
import type { Note, Profile, SchoolId } from "@/lib/types";
import { isSessionFeedbackV2 } from "@/lib/types";
import AppNav from "./AppNav";
import ArcCarousel from "./ArcCarousel";
import MentorIntroCard from "./MentorIntroCard";
import MentorPortrait from "./MentorPortrait";
import ReplyBubble from "./ReplyBubble";
import XiaoyuAvatar from "./XiaoyuAvatar";
import XiaoyuRunLoader from "./XiaoyuRunLoader";

export default function NoteView({
  initialNote,
  initialProfile,
  initialSchool = null,
  inviteFromLanding = false,
}: {
  initialNote: Note;
  initialProfile: Profile | null;
  initialSchool?: SchoolId | null;
  inviteFromLanding?: boolean;
}) {
  const router = useRouter();
  const [note, setNote] = useState(initialNote);
  const [, setProfile] = useState(initialProfile);
  const [commentsLoading, setCommentsLoading] = useState(!initialNote.comments);
  const [commentsError, setCommentsError] = useState(false);
  const [previewSchool, setPreviewSchool] = useState<SchoolId | null>(
    initialSchool ?? initialNote.comments?.[0]?.school ?? null
  );
  const [chatSchool, setChatSchool] = useState<SchoolId | null>(
    initialSchool ?? initialNote.selectedSchool ?? null
  );
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [showInviteGuide, setShowInviteGuide] = useState(inviteFromLanding);
  const commentsStarted = useRef(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const isCrisis = note.risk?.level === "crisis";

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 3000);
  };

  const generateComments = async () => {
    if (isCrisis) return;
    setCommentsLoading(true);
    setCommentsError(false);
    try {
      const response = await fetch(`/api/notes/${note.id}/comments`, { method: "POST" });
      const data = await response.json();
      if (data.comments) {
        setNote((current) => ({ ...current, comments: data.comments }));
        setPreviewSchool((current) => current ?? data.comments[0]?.school ?? null);
      } else {
        if (data.risk) {
          setNote((current) => ({ ...current, risk: data.risk }));
        }
        setCommentsError(true);
      }
    } catch {
      setCommentsError(true);
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    if (initialNote.comments || initialNote.risk?.level === "crisis" || commentsStarted.current) return;
    commentsStarted.current = true;
    void generateComments();
  }, []);

  useEffect(() => {
    const node = messagesRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [chatSchool, note.conversations, sending, previewSchool, note.comments, commentsLoading]);

  const sendChat = async () => {
    if (!chatSchool || !input.trim() || sending) return;
    const school = chatSchool;
    const text = input.trim();
    setInput("");
    setSending(true);
    setShowInviteGuide(false);
    const userMessage = {
      role: "user" as const,
      school,
      content: text,
      createdAt: new Date().toISOString(),
    };
    setNote((current) => ({
      ...current,
      selectedSchool: school,
      conversations: {
        ...current.conversations,
        [school]: [...(current.conversations[school] ?? []), userMessage],
      },
    }));

    try {
      const response = await fetch(`/api/notes/${note.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ school, message: text }),
      });
      const data = await response.json();
      if (!response.ok || !data.reply) {
        flash(data.error ?? "发送失败，请重试");
        return;
      }
      setNote((current) => ({
        ...current,
        conversations: {
          ...current.conversations,
          [school]: [...(current.conversations[school] ?? []), data.reply],
        },
      }));
      if (data.profile) {
        setProfile(data.profile);
        flash("这段对话已沉淀进你的画像");
      }
    } catch {
      flash("发送失败，请重试");
    } finally {
      setSending(false);
    }
  };

  const finishSession = async () => {
    setFeedbackLoading(true);
    try {
      // 服务端会比对谈话导师是否与当前会话一致；旧版误收四位导师时会自动重生成
      const response = await fetch(`/api/notes/${note.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = await response.json();
      if (!response.ok) {
        flash(data.error ?? "反馈生成失败，请重试");
        return;
      }
      if (data.feedback) {
        setNote((current) => ({ ...current, feedback: data.feedback }));
      }
      router.push(`/notes/${note.id}/feedback`);
    } catch {
      flash("反馈生成失败，请重试");
    } finally {
      setFeedbackLoading(false);
    }
  };

  const carouselPeople = useMemo(
    () =>
      (note.comments ?? []).map((comment) => {
        const persona = getSchool(comment.school);
        const info = MENTOR_DISPLAY[comment.school];
        const agent = comment.agentId ? `Agent ${comment.agentId}` : "";
        const degraded = comment.degraded ? "备用" : "";
        const meta = [persona.school, agent, degraded].filter(Boolean).join(" · ");
        return {
          id: comment.school,
          name: persona.name,
          image: "",
          title: meta,
          description: info.cardLead,
        };
      }),
    [note.comments]
  );

  const activeSchool = chatSchool ?? previewSchool;
  const activeComment = note.comments?.find((comment) => comment.school === activeSchool) ?? null;
  const activeInfo = activeSchool ? MENTOR_DISPLAY[activeSchool] : null;
  const chatMessages = chatSchool ? note.conversations[chatSchool] ?? [] : [];
  const inDeepChat = Boolean(chatSchool);

  return (
    <main className="journey-dashboard journey-session">
      <AppNav day={note.day} />

      {notice && <div className="journey-session__notice">{notice}</div>}

      <div className="journey-dashboard__layout journey-session__layout">
        <section className="journey-dashboard__roundtable journey-session__stage" aria-label="圆桌时刻">
          <header className="journey-session__hero">
            <span className="eyebrow">DAY {String(note.day).padStart(2, "0")} · ROUNDTABLE</span>
            <h1>
              <b>CURE</b> room ——圆桌时刻
            </h1>
            <p className={note.comments ? "journey-session__hero-guide" : undefined}>
              {note.comments
                ? "左右点击/滑动选择心仪导师，进入深聊~"
                : "小愈正在邀请导师入席。你可以先看着自己写下的这一刻。"}
            </p>
          </header>

          {note.risk && (
            <section className={`journey-session__risk alert-${note.risk.level}`}>
              <strong>{note.risk.title}</strong>
              <p>{note.risk.message}</p>
              {note.risk.resources?.map((resource) => (
                <span key={resource}>{resource}</span>
              ))}
            </section>
          )}

          <div className="journey-session__stage-center">
            {note.comments ? (
              <ArcCarousel
                className="journey-dashboard__arc journey-session__arc"
                variant="scrapbook"
                people={carouselPeople}
                activeId={chatSchool}
                renderCard={(person) => (
                  <MentorIntroCard feature={MENTOR_DISPLAY[person.id as SchoolId].feature} />
                )}
                onActiveChange={(person) => {
                  if (!chatSchool) setPreviewSchool(person.id as SchoolId);
                }}
                onSelect={(person) => {
                  const school = person.id as SchoolId;
                  setPreviewSchool(school);
                  setChatSchool(school);
                }}
                selectLabel="和这位导师深聊"
                tableLabel="ROUND TABLE"
                tableHint="左右滑动选人，点中间确认深聊"
              />
            ) : (
              <div className="journey-session__waiting" aria-hidden="true">
                {isCrisis ? (
                  <div className="journey-session__empty-table">
                    <span>先把安全放在第一位</span>
                  </div>
                ) : (
                  <XiaoyuRunLoader size="lg" label="导师会晤中" />
                )}
              </div>
            )}
          </div>

          <div className="journey-session__finish">
            {chatMessages.length > 0 && (
              <p>聊到这里也可以。小愈会替你整理今天值得带走的部分。</p>
            )}
            <button
              type="button"
              onClick={finishSession}
              disabled={feedbackLoading || !note.comments}
              className="primary-pill"
            >
              {feedbackLoading
                ? "小愈正在整理…"
                : isSessionFeedbackV2(note.feedback)
                  ? "查看本轮反馈 →"
                  : "结束圆桌，生成反馈 →"}
            </button>
          </div>
        </section>

        <aside className="journey-session__chat" aria-label="会话">
          <div className="journey-session__note">
            <span>
              {MOOD_MARKS[note.mood] ?? "平"} · {note.prompt}
            </span>
            <p>{note.content}</p>
          </div>

          <div className="journey-session__messages" ref={messagesRef}>
            {!inDeepChat && (
              <>
                {!note.comments ? (
                  <div className="journey-session__row is-host">
                    <XiaoyuAvatar variant="host" size="sm" />
                    <ReplyBubble
                      tone="host"
                      size="md"
                      title="小愈"
                      subtitle={isCrisis ? "安全优先" : commentsError ? "暂时卡住了" : "正在邀请导师"}
                    >
                      <p>
                        {isCrisis
                          ? "圆桌分析已暂停，请先联系现实中的支持。你的安全比继续分析更重要。"
                          : commentsError
                            ? "这一轮回应没有顺利抵达。你可以再试一次，或先看看自己写下的这一刻。"
                            : commentsLoading
                              ? "我正在认真读你写下的这一刻，四位导师马上入席。"
                              : "稍等，我去请导师们入席。"}
                      </p>
                    </ReplyBubble>
                  </div>
                ) : (
                  <div className="journey-session__row is-host">
                    <XiaoyuAvatar variant="host" size="sm" />
                    <ReplyBubble tone="host" size="md" title="小愈">
                      <p>
                        四位导师已入席。左侧滑动纸片选人，点中间卡片或「深聊」后，就能在右侧继续说；下面先是他们各自的开场回应。
                      </p>
                    </ReplyBubble>
                  </div>
                )}

                {commentsError && !isCrisis && !note.comments && (
                  <div className="journey-session__row is-host">
                    <button
                      type="button"
                      onClick={generateComments}
                      disabled={commentsLoading}
                      className="primary-pill"
                    >
                      {commentsLoading ? "正在重新尝试…" : "重新听听回应 →"}
                    </button>
                  </div>
                )}

                {note.comments &&
                  note.comments.map((comment) => {
                    const info = MENTOR_DISPLAY[comment.school];
                    const isActive = previewSchool === comment.school;
                    return (
                      <div
                        key={comment.school}
                        className={`journey-session__row is-mentor ${isActive ? "is-active-opening" : ""}`}
                      >
                        <MentorPortrait feature={info.feature} />
                        <ReplyBubble tone="mentor" size="md" title={info.name} subtitle={info.school}>
                          <p>{comment.text}</p>
                        </ReplyBubble>
                      </div>
                    );
                  })}
              </>
            )}

            {inDeepChat && chatSchool && (
              <>
                <div className="journey-session__chat-head">
                  <div>
                    <span className="eyebrow">ONE TO ONE</span>
                    <h2>和 {getSchool(chatSchool).name} 继续聊</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (chatSchool) setPreviewSchool(chatSchool);
                      setChatSchool(null);
                    }}
                  >
                    返回圆桌 ×
                  </button>
                </div>

                {(showInviteGuide || chatMessages.length === 0) && (
                  <div className="journey-session__row is-host">
                    <XiaoyuAvatar variant="host" size="sm" />
                    <ReplyBubble tone="host" size="md" title="小愈" subtitle="先帮你开个场">
                      <p>
                        {showInviteGuide
                          ? `你想和${getSchool(chatSchool).name}聊聊。还没写下这一刻也没关系——此刻最想说的，先随便开口就好。`
                          : "从刚才最触动你的那一句开始就好。"}
                      </p>
                    </ReplyBubble>
                  </div>
                )}

                {!showInviteGuide && activeComment && activeInfo && (
                  <div className="journey-session__row is-mentor">
                    <MentorPortrait feature={activeInfo.feature} />
                    <ReplyBubble tone="mentor" size="md" title={activeInfo.name} subtitle="开场回应">
                      <p>{activeComment.text}</p>
                    </ReplyBubble>
                  </div>
                )}

                {chatMessages.map((message, index) => (
                  <div
                    key={`${message.createdAt}-${index}`}
                    className={`journey-session__row ${message.role === "user" ? "is-user" : "is-mentor"}`}
                  >
                    {message.role === "assistant" && (
                      <MentorPortrait feature={MENTOR_DISPLAY[message.school].feature} />
                    )}
                    <ReplyBubble
                      tone={message.role === "user" ? "user" : "mentor"}
                      size={message.role === "assistant" ? "lg" : "md"}
                    >
                      <p>{message.content}</p>
                    </ReplyBubble>
                  </div>
                ))}

                {sending && <p className="journey-session__typing">正在认真想一想……</p>}
              </>
            )}
          </div>

          {inDeepChat && chatSchool ? (
            <div className="journey-session__composer">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && sendChat()}
                placeholder={`和 ${getSchool(chatSchool).name} 说点什么……`}
              />
              <button type="button" onClick={sendChat} disabled={sending || !input.trim()}>
                发送 ↑
              </button>
            </div>
          ) : note.comments && activeSchool ? (
            <div className="journey-session__composer is-hint">
              <p>
                当前预览：{getSchool(activeSchool).name}
                。确认后点右侧按钮，在这里开始一对一深聊。
              </p>
              <button type="button" className="primary-pill" onClick={() => setChatSchool(activeSchool)}>
                和 {getSchool(activeSchool).name} 深聊 →
              </button>
            </div>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
