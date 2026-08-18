"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import type { SchoolPersona } from "@/lib/personas";
import { MENTOR_DISPLAY } from "@/lib/mentors";
import MentorPortrait from "@/components/MentorPortrait";

type Props = {
  mentors: SchoolPersona[];
  title?: string;
  overline?: string;
  className?: string;
};

/** 四位导师头像 + 简介气泡（原落地页右半，现用于主界面左栏） */
export default function MentorMeetPanel({
  mentors,
  title = "让不同流派的心理导师带你看看你自己",
  overline = "MEET YOUR MENTORS",
  className = "",
}: Props) {
  const [selectedId, setSelectedId] = useState(mentors[0]?.id ?? "psychodynamic");
  const selected = mentors.find((mentor) => mentor.id === selectedId) ?? mentors[0];
  const selectedInfo = MENTOR_DISPLAY[selected.id];
  const bubblePosition = `${(mentors.findIndex((mentor) => mentor.id === selected.id) + 0.5) * (100 / mentors.length)}%`;

  return (
    <section className={`mentor-meet ${className}`.trim()} aria-labelledby="mentor-meet-title">
      <p className="warm-home__overline">{overline}</p>
      <h2 id="mentor-meet-title">{title}</h2>

      <div className="warm-home__mentor-row" role="tablist" aria-label="选择一位心灵导师">
        {mentors.map((mentor) => {
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
              aria-controls="mentor-meet-intro"
            >
              <MentorPortrait feature={info.feature} />
              <strong>{info.name}</strong>
              <small>{info.school}</small>
            </button>
          );
        })}
      </div>

      <article
        id="mentor-meet-intro"
        className="warm-home__bubble"
        data-mentor={selectedInfo.feature}
        style={{ "--bubble-position": bubblePosition } as CSSProperties}
      >
        <span className="warm-home__bubble-tail" aria-hidden="true" />
        <div>
          <p className="warm-home__bubble-title">
            {selectedInfo.name}（{selectedInfo.school}）
          </p>
          <ul className="mentor-keywords" aria-label="关键词">
            {selectedInfo.keywords.map((keyword, index) => (
              <li key={keyword} className={`mentor-keywords__tag mentor-keywords__tag--${index}`}>
                {keyword}
              </li>
            ))}
          </ul>
          <p>{selectedInfo.intro}</p>
        </div>
      </article>
    </section>
  );
}
