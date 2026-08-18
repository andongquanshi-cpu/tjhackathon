import type { MentorFeature } from "@/lib/mentors";
import { getMentorByFeature } from "@/lib/mentors";
import MentorPortrait from "@/components/MentorPortrait";

type Props = {
  feature: MentorFeature;
  className?: string;
  /** 紧凑模式：旋转弧上非激活态可略压缩 */
  compact?: boolean;
};

/** 对话页导师介绍卡：人像 + 英中文名 + 简介（组件化，非整图） */
export default function MentorIntroCard({ feature, className = "", compact = false }: Props) {
  const mentor = getMentorByFeature(feature);

  return (
    <article
      className={`mentor-intro-card mentor-intro-card--${feature} ${compact ? "is-compact" : ""} ${className}`.trim()}
      aria-label={`${mentor.englishName}，${mentor.name}`}
    >
      <span className="mentor-intro-card__grain" aria-hidden="true" />
      <span className="mentor-intro-card__stroke mentor-intro-card__stroke--a" aria-hidden="true" />
      <span className="mentor-intro-card__stroke mentor-intro-card__stroke--b" aria-hidden="true" />
      <span className="mentor-intro-card__stroke mentor-intro-card__stroke--c" aria-hidden="true" />

      <div className="mentor-intro-card__figure">
        <MentorPortrait feature={feature} className="mentor-intro-card__portrait" />
      </div>

      <div className="mentor-intro-card__copy">
        <h3 className="mentor-intro-card__en">{mentor.englishName}</h3>
        <p className="mentor-intro-card__zh">{mentor.name}</p>
        <hr className="mentor-intro-card__rule" />
        <p className="mentor-intro-card__lead">{mentor.cardLead}</p>
        <p className="mentor-intro-card__body">{mentor.cardBody}</p>
      </div>
    </article>
  );
}
