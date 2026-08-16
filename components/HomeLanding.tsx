"use client";

import Link from "next/link";
import { useState } from "react";
import type { CSSProperties } from "react";
import type { SchoolPersona } from "@/lib/personas";
import XiaoyuAvatar from "@/components/XiaoyuAvatar";
import AuthControl from "@/components/AuthControl";

type Props = {
  mentors: SchoolPersona[];
  hasProfile: boolean;
  day: number;
  notesCount: number;
};

const HOME_MENTORS = {
  humanistic: {
    name: "西格蒙德·弗洛伊德",
    school: "精神分析",
    description: "强调童年性本能与无意识冲突，人格由本我、自我、超我构成。",
    feature: "freud",
  },
  psychodynamic: {
    name: "卡尔·罗杰斯",
    school: "人本主义",
    description: "坚信人的“自我实现”倾向，主张以无条件的积极关注和共情来促进来访者成长。",
    feature: "rogers",
  },
  cognitive: {
    name: "阿尔伯特·班杜拉",
    school: "社会认知理论",
    description: "在行为主义基础上加入认知因素，提出“观察学习”和“自我效能感”，强调人与环境的交互作用。",
    feature: "bandura",
  },
  postmodern: {
    name: "B.F. 斯金纳",
    school: "行为主义",
    description: "只研究可观察行为，认为一切心理都是环境刺激与操作性条件反射的产物。",
    feature: "skinner",
  },
} satisfies Record<SchoolPersona["id"], { name: string; school: string; description: string; feature: string }>;

export default function HomeLanding({ mentors, hasProfile, day, notesCount }: Props) {
  const [selectedId, setSelectedId] = useState(mentors[0].id);
  const selected = mentors.find((mentor) => mentor.id === selectedId) ?? mentors[0];
  const selectedInfo = HOME_MENTORS[selected.id];
  const planHref = hasProfile ? "/guide" : "/assessment";
  const roundtableHref = hasProfile ? "/journal" : "/assessment";

  return (
    <main className="warm-home">
      <header className="warm-home__nav">
        <AuthControl />
        <nav aria-label="主导航">
          <Link href="/" aria-current="page">首页</Link>
          <Link href={planHref}>21 天计划</Link>
          <Link href="/journal">便利贴</Link>
          <Link href={roundtableHref}>圆桌会谈</Link>
        </nav>
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
              const info = HOME_MENTORS[mentor.id];
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
                  <span className={`warm-home__portrait warm-home__portrait--${info.feature}`}>
                    <span className="warm-home__face" aria-hidden="true">
                      <span className="warm-home__hair" />
                      <span className="warm-home__eye warm-home__eye--left" />
                      <span className="warm-home__eye warm-home__eye--right" />
                      <span className="warm-home__glasses" />
                      <span className="warm-home__nose" />
                      <span className="warm-home__mouth" />
                      <span className="warm-home__beard" />
                      <span className="warm-home__chin" />
                    </span>
                    <i>{mentor.name.replace("小愈·", "")}</i>
                  </span>
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
            <div className="warm-home__bubble-mark">{selected.name.replace("小愈·", "")}</div>
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
