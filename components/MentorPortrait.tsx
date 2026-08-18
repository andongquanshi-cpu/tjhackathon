import Image from "next/image";
import type { MentorFeature } from "@/lib/mentors";

const MENTOR_ALT: Record<MentorFeature, string> = {
  freud: "西格蒙德·弗洛伊德",
  rogers: "卡尔·罗杰斯",
  bandura: "阿尔伯特·班杜拉",
  skinner: "B.F. 斯金纳",
};

export default function MentorPortrait({
  feature,
  className = "",
}: {
  feature: MentorFeature;
  className?: string;
}) {
  return (
    <span className={`warm-home__portrait warm-home__portrait--${feature} warm-home__portrait--photo ${className}`.trim()}>
      <Image
        src={`/mentors/${feature}.png`}
        alt={MENTOR_ALT[feature]}
        width={200}
        height={240}
        className="warm-home__portrait-img"
        draggable={false}
      />
    </span>
  );
}
