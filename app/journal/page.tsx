"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Note, Profile } from "@/lib/types";

const MOOD = [
  { v: 1, e: "😞", label: "低落" },
  { v: 2, e: "😔", label: "疲惫" },
  { v: 3, e: "😐", label: "平稳" },
  { v: 4, e: "🙂", label: "不错" },
  { v: 5, e: "😊", label: "晴朗" },
];

export default function JournalPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [content, setContent] = useState("");
  const [mood, setMood] = useState(3);
  const [saving, setSaving] = useState(false);
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    (async () => {
      const [notesRes, profileRes] = await Promise.all([
        fetch("/api/notes"),
        fetch("/api/profile"),
      ]);
      const [notesData, profileData] = await Promise.all([notesRes.json(), profileRes.json()]);
      setNotes(notesData.notes ?? []);
      setProfile(profileData.profile ?? null);
    })();
  }, []);

  const save = async () => {
    if (!content.trim() || saving) return;
    setSaving(true);
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
      }
    } finally {
      setSaving(false);
    }
  };

  const sorted = [...notes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
          ← 首页
        </Link>
        <Link href="/profile" className="rounded-full bg-white/70 px-4 py-1.5 text-sm text-slate-600 shadow-sm hover:bg-white">
          🌱 我的画像
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-slate-800">便签本</h1>
      <p className="mt-1 text-sm text-slate-500">
        {profile ? `训练营第 ${Math.min(21, Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / 86_400_000) + 1)} 天` : "先完成测评，再开始记录吧"}
      </p>

      {/* 写便签 */}
      <div className="note-paper mt-6 p-6 pt-10">
        <div className="mb-3 text-xs text-amber-700/70">
          {prompt || "今日引导：此刻，你最想写下什么？"}
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          placeholder="把这一刻的感受、念头或小事写下来…"
          className="w-full resize-none bg-transparent text-[15px] leading-7 text-slate-700 outline-none placeholder:text-slate-300"
        />
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {MOOD.map((m) => (
              <button
                key={m.v}
                onClick={() => setMood(m.v)}
                title={m.label}
                className={`rounded-full px-2.5 py-1 text-lg transition ${
                  mood === m.v ? "bg-amber-100 ring-2 ring-amber-300" : "opacity-50 hover:opacity-90"
                }`}
              >
                {m.e}
              </button>
            ))}
          </div>
          <button
            onClick={save}
            disabled={!content.trim() || saving}
            className="rounded-full bg-teal-600 px-6 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-teal-500 disabled:opacity-40"
          >
            {saving ? "保存中…" : "贴上便签 →"}
          </button>
        </div>
      </div>

      {/* 历史便签 */}
      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-slate-700">
          过去的便签 <span className="text-sm font-normal text-slate-400">（{sorted.length}）</span>
        </h2>
        {sorted.length === 0 && (
          <p className="rounded-2xl bg-white/60 p-6 text-center text-sm text-slate-400">
            还没有便签，写下第一张吧 🌱
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {sorted.map((n) => (
            <Link
              key={n.id}
              href={`/notes/${n.id}`}
              className="group rounded-3xl border border-slate-100 bg-white/80 p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md"
            >
              <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                <span>Day {n.day}</span>
                <span>{["😞", "😔", "😐", "🙂", "😊"][n.mood - 1]}</span>
              </div>
              <p className="line-clamp-3 text-sm leading-6 text-slate-600">{n.content}</p>
              <div className="mt-3 text-xs text-teal-600 opacity-0 transition group-hover:opacity-100">
                查看流派回应 →
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}