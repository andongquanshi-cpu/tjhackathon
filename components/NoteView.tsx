"use client";

import { useState } from "react";
import Link from "next/link";
import { SCHOOLS, getSchool } from "@/lib/personas";
import type { Note, Profile, SchoolId } from "@/lib/types";
import SchoolAvatar from "./SchoolAvatar";

const MOOD: Record<number, string> = { 1: "😞", 2: "😔", 3: "😐", 4: "🙂", 5: "😊" };

export default function NoteView({
  initialNote,
  initialProfile,
}: {
  initialNote: Note;
  initialProfile: Profile | null;
}) {
  const [note, setNote] = useState(initialNote);
  const [profile, setProfile] = useState(initialProfile);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [chatSchool, setChatSchool] = useState<SchoolId | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  const generateComments = async () => {
    setCommentsLoading(true);
    try {
      const res = await fetch(`/api/notes/${note.id}/comments`, { method: "POST" });
      const data = await res.json();
      if (data.comments) {
        setNote((n) => ({ ...n, comments: data.comments }));
        flash("四个流派已经读完你的便签 ✨");
      }
    } catch (err) {
      console.error(err);
      flash("生成失败，请重试");
    } finally {
      setCommentsLoading(false);
    }
  };

  const sendChat = async () => {
    if (!chatSchool || !input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);

    const optimistic: Note = {
      ...note,
      conversations: {
        ...note.conversations,
        [chatSchool]: [
          ...(note.conversations[chatSchool] ?? []),
          { role: "user", school: chatSchool, content: text, createdAt: new Date().toISOString() },
        ],
      },
    };
    setNote(optimistic);

    try {
      const res = await fetch(`/api/notes/${note.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ school: chatSchool, message: text }),
      });
      const data = await res.json();
      if (data.reply) {
        setNote((n) => ({
          ...n,
          conversations: {
            ...n.conversations,
            [chatSchool]: [...(n.conversations[chatSchool] ?? []), data.reply],
          },
        }));
      }
      if (data.profile) {
        setProfile(data.profile);
        flash("这次的对话已沉淀进你的画像 🌱");
      }
    } catch (err) {
      console.error(err);
      flash("发送失败，请重试");
    } finally {
      setSending(false);
    }
  };

  const chatMessages = chatSchool ? note.conversations[chatSchool] ?? [] : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* 顶栏 */}
      <div className="mb-6 flex items-center justify-between text-sm">
        <Link href="/journal" className="text-slate-500 hover:text-slate-800">
          ← 返回便签本
        </Link>
        <Link href="/profile" className="rounded-full bg-white/70 px-4 py-1.5 text-slate-600 shadow-sm hover:bg-white">
          🌱 我的画像
        </Link>
      </div>

      {notice && (
        <div className="fade-up mb-4 rounded-2xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700 ring-1 ring-emerald-200">
          {notice}
        </div>
      )}

      {/* 便签 */}
      <div className="note-paper mx-auto max-w-xl p-6 pt-8 fade-up">
        <div className="mb-2 flex items-center justify-between text-xs text-amber-700/70">
          <span>Day {note.day} · {note.prompt}</span>
          <span className="text-lg">{MOOD[note.mood] ?? "😐"}</span>
        </div>
        <p className="whitespace-pre-wrap text-[15px] leading-7 text-slate-700">{note.content}</p>
        <p className="mt-4 text-right text-[11px] text-slate-400">
          {new Date(note.createdAt).toLocaleString("zh-CN", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      {/* 四流派评论 */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-700">四个流派 · 读你的便签</h2>
          {!note.comments && (
            <button
              onClick={generateComments}
              disabled={commentsLoading}
              className="rounded-full bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-teal-500 disabled:opacity-60"
            >
              {commentsLoading ? "正在阅读…" : "让小愈们读一读 ✨"}
            </button>
          )}
        </div>

        {!note.comments && !commentsLoading && (
          <p className="rounded-2xl bg-white/60 p-4 text-sm text-slate-500">
            小愈的四个伙伴还没有读过这张便签。点击上方按钮，让
            {SCHOOLS.map((s) => `${s.name}（${s.school}）`).join("、")}分别给你回应。
          </p>
        )}

        {note.comments && (
          <div className="grid gap-4 sm:grid-cols-2">
            {note.comments.map((c) => {
              const persona = getSchool(c.school);
              const active = chatSchool === c.school;
              return (
                <div
                  key={c.school}
                  className={`fade-up rounded-3xl border bg-white/80 p-5 shadow-sm transition ${
                    active ? "border-teal-300 ring-2 ring-teal-100" : "border-slate-100"
                  }`}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <SchoolAvatar persona={persona} />
                    <div>
                      <div className="font-semibold text-slate-700">{persona.name}</div>
                      <div className="text-xs text-slate-400">{persona.school} · {persona.tagline}</div>
                    </div>
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{c.text}</p>
                  <button
                    onClick={() => setChatSchool(active ? null : c.school)}
                    className="mt-4 rounded-full border border-teal-200 px-3 py-1.5 text-xs font-medium text-teal-700 transition hover:bg-teal-50"
                  >
                    {active ? "收起对话" : "和 TA 继续聊 →"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 深聊面板 */}
      {chatSchool && (
        <section className="fade-up mt-8 rounded-3xl border border-slate-100 bg-white/85 p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <SchoolAvatar persona={getSchool(chatSchool)} />
            <div>
              <div className="font-semibold text-slate-700">{getSchool(chatSchool).name}</div>
              <div className="text-xs text-slate-400">围绕这张便签，和 TA 多聊几轮</div>
            </div>
          </div>

          <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
            {chatMessages.length === 0 && (
              <p className="rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-400">
                从你感兴趣的地方开始吧～
              </p>
            )}
            {chatMessages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="mr-2 self-end">
                    <SchoolAvatar persona={getSchool(m.school)} size="sm" />
                  </div>
                )}
                <div
                  className={`max-w-[78%] whitespace-pre-wrap px-4 py-2.5 text-sm leading-6 ${
                    m.role === "user"
                      ? "bubble-user bg-teal-600 text-white"
                      : "bubble-ai bg-slate-100 text-slate-700"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="mr-2 self-end">
                  <SchoolAvatar persona={getSchool(chatSchool)} size="sm" />
                </div>
                <div className="bubble-ai flex items-center gap-1 bg-slate-100 px-4 py-3">
                  <span className="typing-dot h-2 w-2 rounded-full bg-slate-400" />
                  <span className="typing-dot h-2 w-2 rounded-full bg-slate-400" />
                  <span className="typing-dot h-2 w-2 rounded-full bg-slate-400" />
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
              placeholder={`和 ${getSchool(chatSchool).name} 说点什么…`}
              className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-teal-400"
            />
            <button
              onClick={sendChat}
              disabled={sending || !input.trim()}
              className="rounded-full bg-teal-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-teal-500 disabled:opacity-50"
            >
              发送
            </button>
          </div>
        </section>
      )}
    </div>
  );
}