"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSchool } from "@/lib/personas";
import type { Note, Profile, SchoolId } from "@/lib/types";
import XiaoyuAvatar from "./XiaoyuAvatar";

const MOOD: Record<number, string> = { 1: "阴", 2: "倦", 3: "平", 4: "暖", 5: "晴" };

export default function NoteView({
  initialNote,
  initialProfile,
}: {
  initialNote: Note;
  initialProfile: Profile | null;
}) {
  const router = useRouter();
  const [note, setNote] = useState(initialNote);
  const [, setProfile] = useState(initialProfile);
  const [commentsLoading, setCommentsLoading] = useState(!initialNote.comments);
  const [commentsError, setCommentsError] = useState(false);
  const [chatSchool, setChatSchool] = useState<SchoolId | null>(initialNote.selectedSchool ?? null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const commentsStarted = useRef(false);
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

  const sendChat = async () => {
    if (!chatSchool || !input.trim() || sending) return;
    const school = chatSchool;
    const text = input.trim();
    setInput("");
    setSending(true);
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
    if (note.feedback) {
      router.push(`/notes/${note.id}/feedback`);
      return;
    }
    setFeedbackLoading(true);
    try {
      const response = await fetch(`/api/notes/${note.id}/feedback`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) {
        flash(data.error ?? "反馈生成失败，请重试");
        return;
      }
      router.push(`/notes/${note.id}/feedback`);
    } catch {
      flash("反馈生成失败，请重试");
    } finally {
      setFeedbackLoading(false);
    }
  };

  const chatMessages = chatSchool ? note.conversations[chatSchool] ?? [] : [];

  return (
    <main className="roundtable-page min-h-screen">
      <header className="roundtable-nav">
        <Link href="/journal">← 返回主界面</Link>
        <span>DAY {note.day} · 圆桌会议</span>
        <Link href="/profile">我的画像</Link>
      </header>

      {notice && <div className="roundtable-notice">{notice}</div>}
      {note.risk && (
        <section className={`session-risk alert-${note.risk.level}`}>
          <strong>{note.risk.title}</strong>
          <p>{note.risk.message}</p>
          {note.risk.resources?.map((resource) => <span key={resource}>{resource}</span>)}
        </section>
      )}

      <section className="roundtable-intro">
        <div className="host-seat">
          <XiaoyuAvatar variant="host" size="md" />
          <div>
            <span className="eyebrow">主持人 · 小愈</span>
            <p>“谢谢你把这一刻带到桌上。我们不急着解决，先从不同方向看看它。”</p>
          </div>
        </div>
        <div className="source-note">
          <span>{MOOD[note.mood] ?? "平"} · {note.prompt}</span>
          <p>{note.content}</p>
        </div>
      </section>

      {!note.comments ? (
        <section className="roundtable-start">
          <div className="empty-table">
            <span>{isCrisis ? "现在先把你的安全放在第一位" : commentsError ? "回应暂时没有抵达" : "正在认真读你写下的这一刻"}</span>
          </div>
          <h1>{isCrisis ? "圆桌分析已暂停，请先联系现实中的支持" : commentsError ? "这次没有顺利听见回应" : "导师会晤中~"}</h1>
          {commentsError && !isCrisis && (
            <button onClick={generateComments} disabled={commentsLoading} className="primary-pill">
              {commentsLoading ? "正在重新尝试…" : "重新听听回应 →"}
            </button>
          )}
        </section>
      ) : (
        <>
          <section className="roundtable-scene">
            <div className="table-center">
              <span>ROUND TABLE</span>
              <p>点击最触动你的角色<br />进入一对一深聊</p>
            </div>
            <div className="reader-seat">
              <XiaoyuAvatar variant="reader" size="md" />
              <span>此刻的你</span>
            </div>
            {note.comments.map((comment, index) => {
              const persona = getSchool(comment.school);
              return (
                <button
                  key={comment.school}
                  onClick={() => setChatSchool(comment.school)}
                  className={`mentor-seat seat-${index + 1} ${chatSchool === comment.school ? "is-selected" : ""}`}
                >
                  <span className="seat-arrow">↓ 选择我</span>
                  <XiaoyuAvatar variant={comment.school} size="md" />
                  <div className="seat-bubble">
                    <strong>{persona.name} · {persona.school}</strong>
                    <span className="agent-status">
                      Agent {comment.agentId ?? "—"}{comment.degraded ? " · 备用通道" : ""}
                    </span>
                    <p>{comment.text}</p>
                  </div>
                </button>
              );
            })}
          </section>

          {chatSchool && (
            <section className="dialog-panel fade-up">
              <header>
                <div>
                  <span className="eyebrow">ONE TO ONE</span>
                  <h2>和 {getSchool(chatSchool).name} 继续聊</h2>
                </div>
                <button onClick={() => setChatSchool(null)}>返回圆桌 ×</button>
              </header>

              <div className="dialog-messages">
                {chatMessages.length === 0 && (
                  <div className="dialog-empty">
                    <XiaoyuAvatar variant={chatSchool} size="sm" />
                    <p>“从刚才最触动你的那一句开始就好。”</p>
                  </div>
                )}
                {chatMessages.map((message, index) => (
                  <div key={`${message.createdAt}-${index}`} className={`dialog-row ${message.role}`}>
                    {message.role === "assistant" && <XiaoyuAvatar variant={message.school} size="sm" />}
                    <p>{message.content}</p>
                  </div>
                ))}
                {sending && <div className="typing-line">正在认真想一想……</div>}
              </div>

              <div className="dialog-input">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && sendChat()}
                  placeholder={`和 ${getSchool(chatSchool).name} 说点什么……`}
                />
                <button onClick={sendChat} disabled={sending || !input.trim()}>发送 ↑</button>
              </div>
            </section>
          )}

          <div className="session-finish">
            <p>
              {chatMessages.length
                ? "聊到这里也可以。小愈会替你整理今天值得带走的部分。"
                : "你可以先选择一位导师深聊，也可以直接收下四种视角。"}
            </p>
            <button onClick={finishSession} disabled={feedbackLoading} className="primary-pill">
              {feedbackLoading ? "小愈正在整理…" : note.feedback ? "查看本轮反馈 →" : "结束圆桌，生成反馈 →"}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
