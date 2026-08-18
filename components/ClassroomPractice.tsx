"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import AppNav from "@/components/AppNav";
import XiaoyuAvatar from "@/components/XiaoyuAvatar";
import {
  pickClassroomCard,
  readLastClassroomId,
  rememberClassroomId,
  type ClassroomCard,
} from "@/lib/classroom";

export default function ClassroomPractice() {
  const searchParams = useSearchParams();
  const day = Number(searchParams.get("day") || "1");
  const [card, setCard] = useState<ClassroomCard | null>(null);

  useEffect(() => {
    const next = pickClassroomCard(readLastClassroomId());
    rememberClassroomId(next.id);
    setCard(next);
  }, []);

  return (
    <main className="practice-page practice-page--classroom">
      <AppNav day={day} />
      <section className="practice-stage practice-stage--classroom">
        <div className="classroom-top">
          <Link href="/journal" className="practice-back">
            ← 回到主界面
          </Link>
          <div className="practice-host practice-host--classroom">
            <XiaoyuAvatar variant="host" size="sm" />
            <div>
              <span className="eyebrow">MICRO CLASS · 1 分钟</span>
              <h1>心理微课堂</h1>
              <p>每次一张小卡片 · 离开再进可换题</p>
            </div>
          </div>
        </div>

        {!card ? (
          <p className="practice-loading">小愈正在抽卡…</p>
        ) : (
          <article className="classroom-card fade-up" aria-live="polite">
            <header className="classroom-card__head">
              <span className="classroom-card__badge">今日一张</span>
              <h2>{card.title}</h2>
              {card.aka && <p className="classroom-card__aka">{card.aka}</p>}
              <p className="classroom-card__hook">{card.oneLiner}</p>
            </header>
            <div className="classroom-card__body">
              <p>{card.body}</p>
              <blockquote>
                <span>带走一句</span>
                {card.takeaway}
              </blockquote>
              <p className="classroom-card__note">
                通俗介绍，非诊断。若情绪持续很难受，请联系可信任的人或专业支持。
              </p>
            </div>
          </article>
        )}

        <div className="classroom-actions">
          <Link href="/journal" className="practice-cta">
            看完了，回到主界面 →
          </Link>
        </div>
      </section>
    </main>
  );
}
