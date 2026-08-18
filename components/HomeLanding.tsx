"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { SchoolId } from "@/lib/types";
import { MENTOR_DISPLAY } from "@/lib/mentors";
import XiaoyuAvatar from "@/components/XiaoyuAvatar";
import AuthControl from "@/components/AuthControl";
import DemoButtons from "@/components/DemoButtons";

type Props = {
  hasProfile: boolean;
  day: number;
  notesCount: number;
};

/** 热区坐标对齐 public/landing/home-scene.svg（viewBox 1040 30 880 1000） */
const LANDING_MENTORS: {
  id: SchoolId;
  shortName: string;
  className: string;
}[] = [
  {
    id: "postmodern",
    shortName: "斯金纳",
    className: "is-skinner",
  },
  {
    id: "psychodynamic",
    shortName: "弗洛伊德",
    className: "is-freud",
  },
  {
    id: "cognitive",
    shortName: "班杜拉",
    className: "is-bandura",
  },
  {
    id: "humanistic",
    shortName: "罗杰斯",
    className: "is-rogers",
  },
];

export default function HomeLanding({ hasProfile, day, notesCount }: Props) {
  const router = useRouter();
  const [startingSchool, setStartingSchool] = useState<SchoolId | null>(null);
  const [error, setError] = useState("");
  const [inviteReady, setInviteReady] = useState(false);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setInviteReady(true);
      return;
    }
    const id = window.setTimeout(() => setInviteReady(true), 80);
    return () => window.clearTimeout(id);
  }, []);

  const startMentorChat = async (school: SchoolId) => {
    if (startingSchool) return;
    setStartingSchool(school);
    setError("");
    const info = MENTOR_DISPLAY[school];
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `想和${info.name}聊聊`,
          mood: 3,
          selectedSchool: school,
          fromLanding: true,
        }),
      });
      const data = await res.json();
      if (!data.note?.id) {
        setError(data.error ?? "没能打开聊天，请稍后再试");
        setStartingSchool(null);
        return;
      }
      router.push(`/notes/${data.note.id}?school=${school}&invite=1`);
    } catch {
      setError("网络似乎走神了，请稍后重试");
      setStartingSchool(null);
    }
  };

  return (
    <main className="warm-home">
      <header className="warm-home__nav">
        <DemoButtons />
        <div aria-hidden="true" />
        <AuthControl />
      </header>

      <section className="warm-home__layout warm-home__layout--scene">
        <aside className="warm-home__host warm-home__host--entry" aria-label="INSIDE OUT 邀请">
          <div className={`warm-home__invite${inviteReady ? " is-ready" : ""}`}>
            <header className="warm-home__invite-brand">
              <span className="warm-home__invite-eyebrow">AN INVITATION</span>
              <h1 className="warm-home__invite-title">
                <b>INSIDE</b> OUT
              </h1>
              <p className="warm-home__invite-sub">每个人都值得被看见 · 疗愈平权</p>
            </header>

            <div className="warm-home__invite-envelope" aria-hidden={!inviteReady}>
              <div className="warm-home__invite-pocket" aria-hidden="true" />
              <div className="warm-home__invite-flap" aria-hidden="true" />
              <div className="warm-home__invite-liner" aria-hidden="true" />
              <article className="warm-home__invite-letter">
                <span className="warm-home__invite-ornament warm-home__invite-ornament--tl" aria-hidden="true" />
                <span className="warm-home__invite-ornament warm-home__invite-ornament--tr" aria-hidden="true" />
                <span className="warm-home__invite-ornament warm-home__invite-ornament--bl" aria-hidden="true" />
                <span className="warm-home__invite-ornament warm-home__invite-ornament--br" aria-hidden="true" />
                <span className="warm-home__invite-ribbon" aria-hidden="true" />
                <div className="warm-home__invite-sign" aria-hidden="true">
                  <span className="warm-home__invite-seal">
                    <i className="warm-home__invite-wax" />
                    <XiaoyuAvatar variant="host" size="sm" />
                  </span>
                  <em>Everyone deserves to be seen.</em>
                </div>
                <div className="warm-home__invite-letter-scroll">
                  <p className="warm-home__invite-dear warm-home__invite-line" style={{ "--line": 1 } as CSSProperties}>
                    亲爱的朋友，
                  </p>
                  <p className="warm-home__invite-line" style={{ "--line": 2 } as CSSProperties}>
                    你是否也有过这样的时刻——深夜 emo，却不知该向谁说；作业堆成山，心里乱成一团；朋友圈点了赞，还是空落落；明明“没事”，却突然很想被懂一懂。
                  </p>
                  <p className="warm-home__invite-line" style={{ "--line": 3 } as CSSProperties}>
                    <b>Inside Out</b>
                    是一个为你准备的倾诉角落。这里没有门槛，也不用先证明自己“够痛苦”。你可以和弗洛伊德、斯金纳、班杜拉、罗杰斯聊聊——他们风格各异，却都愿意认真听，并从各自的角度给你一点看法。
                  </p>
                  <p className="warm-home__invite-line" style={{ "--line": 4 } as CSSProperties}>
                    无论是学业压力、关系里的委屈、对自己的怀疑，还是只想找个人唠两句，你开口就好。我们相信：每个人都值得被看见，疗愈不该是少数人的特权。
                  </p>
                  <p
                    className="warm-home__invite-close warm-home__invite-line"
                    style={{ "--line": 5 } as CSSProperties}
                  >
                    来吧，让自己被好好听一听。
                  </p>
                </div>
              </article>
            </div>

            <Link href="/journal" className="warm-home__plan warm-home__plan--under warm-home__invite-cta">
              <span>
                <small>START YOUR JOURNEY</small>
                <b>{hasProfile ? `继续第 ${day} 天的心灵奇旅` : "开启你的心灵奇旅"}</b>
                {hasProfile && <em>已留下 {notesCount} 条便签</em>}
              </span>
              <i>→</i>
            </Link>
          </div>
        </aside>

        <section className="warm-home__scene" aria-label="和导师聊天">
          <div className="warm-home__scene-frame">
            <img
              className="warm-home__scene-art"
              src="/landing/home-scene.svg"
              alt=""
              draggable={false}
              aria-hidden="true"
            />

            {LANDING_MENTORS.map((mentor) => (
              <button
                key={mentor.id}
                type="button"
                className={`warm-home__hotspot ${mentor.className}${
                  startingSchool === mentor.id ? " is-loading" : ""
                }`}
                onClick={() => startMentorChat(mentor.id)}
                disabled={Boolean(startingSchool)}
                aria-label={
                  startingSchool === mentor.id
                    ? `正在打开和${mentor.shortName}的聊天`
                    : `和${mentor.shortName}聊天`
                }
              >
                <span className="warm-home__hotspot-label">
                  {startingSchool === mentor.id ? "正在打开…" : `和${mentor.shortName}聊天`}
                </span>
              </button>
            ))}
          </div>

          {error && <p className="warm-home__scene-error">{error}</p>}
        </section>
      </section>
    </main>
  );
}
