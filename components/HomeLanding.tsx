"use client";

import Link from "next/link";
import { useState } from "react";
import type { CSSProperties } from "react";
import type { SchoolPersona } from "@/lib/personas";
import { MENTOR_DISPLAY } from "@/lib/mentors";
import XiaoyuAvatar from "@/components/XiaoyuAvatar";
import MentorPortrait from "@/components/MentorPortrait";
import AuthControl from "@/components/AuthControl";

type Props = {
  mentors: SchoolPersona[];
  hasProfile: boolean;
  day: number;
  notesCount: number;
};

export default function HomeLanding({ mentors, hasProfile, day, notesCount }: Props) {
  const [selectedId, setSelectedId] = useState(mentors[0].id);
  const selected = mentors.find((mentor) => mentor.id === selectedId) ?? mentors[0];
  const selectedInfo = MENTOR_DISPLAY[selected.id];
  const planHref = hasProfile ? "/journal" : "/assessment";
  const roundtableHref = hasProfile ? "/journal" : "/assessment";

  return (
    <main className="warm-home">
      <header className="warm-home__nav">
        <AuthControl />
      </header>

      <section className="warm-home__layout">
        <aside className="warm-home__host" aria-label="小愈">
          <span className="warm-home__sketch warm-home__sketch--one" />
          <span className="warm-home__sketch warm-home__sketch--two" />
          <div className="warm-home__host-avatar">
            <XiaoyuAvatar variant="host" size="xl" />
            <span className="warm-home__leaf">✦</span>
          </div>
          <div className="warm-home__host-copy">
            <span>YOUR GENTLE COMPANION</span>
            <h1>你好呀，<br />我是小愈。</h1>
            <p>今天，也想陪你慢慢听见心里的声音。</p>
          </div>
        </aside>

        <section className="warm-home__stage" aria-labelledby="mentor-title">
          <p className="warm-home__overline">MEET YOUR MENTORS</p>
          <h2 id="mentor-title">让不同流派的心理导师带你看看你自己</h2>

          <div className="warm-home__mentor-row" role="tablist" aria-label="选择一位心灵导师">
            {mentors.map((mentor, index) => {
              const isSelected = mentor.id === selectedId;
              const info = MENTOR_DISPLAY[mentor.id];
              return (
                <button
                  key={mentor.id}
                  type="button"
                  className={`warm-home__mentor ${isSelected ? "is-selected" : ""}`}
                  onClick={() => setSelectedId(mentor.id)}
                  role="tab"
                  aria-selected={isSelected}
                  aria-controls="mentor-intro"
                >
                  <span className="warm-home__number">0{index + 1}</span>
                  <MentorPortrait feature={info.feature} />
                  <strong>{info.name}</strong>
                  <small>{info.school}</small>
                </button>
              );
            })}
          </div>

          <article
            id="mentor-intro"
            className="warm-home__bubble"
            style={{ "--bubble-position": `${(mentors.findIndex((mentor) => mentor.id === selected.id) + 0.5) * (100 / mentors.length)}%` } as CSSProperties}
          >
            <span className="warm-home__bubble-tail" aria-hidden="true" />
            <div className="warm-home__bubble-mark">{selectedInfo.mark}</div>
            <div>
              <p className="warm-home__bubble-title">{selectedInfo.name}（{selectedInfo.school}）</p>
              <p>{selectedInfo.description}</p>
            </div>
          </article>

          <div className="warm-home__actions">
            <Link href={planHref} className="warm-home__plan">
              <span>
                <small>21 DAYS OF GENTLE PRACTICE</small>
                <b>{hasProfile ? `继续第 ${day} 天的练习` : "开始 21 天心灵练习"}</b>
                {hasProfile && <em>已留下 {notesCount} 条便签</em>}
              </span>
              <i>→</i>
            </Link>
            <Link href={roundtableHref} className="warm-home__roundtable">
              想要直接和心灵导师沟通？ <span>点击这里</span>
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
