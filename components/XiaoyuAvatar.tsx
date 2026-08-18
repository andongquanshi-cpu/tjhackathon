import Image from "next/image";
import type { SchoolId } from "@/lib/types";

type Variant = "host" | "reader" | SchoolId;

const marks: Record<Variant, string> = {
  host: "愈",
  reader: "我",
  humanistic: "镜",
  psychodynamic: "暖",
  cognitive: "思",
  postmodern: "叙",
};

const tones: Record<Variant, string> = {
  host: "xiaoyu-host",
  reader: "xiaoyu-reader",
  humanistic: "xiaoyu-mirror",
  psychodynamic: "xiaoyu-warm",
  cognitive: "xiaoyu-think",
  postmodern: "xiaoyu-story",
};

const SIZE_PX = {
  sm: 54,
  md: 88,
  lg: 126,
  xl: 280,
} as const;

export default function XiaoyuAvatar({
  variant,
  size = "md",
  className = "",
}: {
  variant: Variant;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const isHost = variant === "host";
  const px = SIZE_PX[size];

  return (
    <div
      className={`xiaoyu-avatar xiaoyu-${size} ${tones[variant]} ${isHost ? "xiaoyu-avatar--photo" : ""} ${className}`.trim()}
      aria-label={variant === "reader" ? "用户形象" : isHost ? "小愈" : `小愈·${marks[variant]}`}
    >
      {isHost ? (
        <Image
          src="/mentors/xiaoyu.png"
          alt=""
          width={px}
          height={Math.round(px * 1.2)}
          className="xiaoyu-avatar__img"
          draggable={false}
          priority={size === "xl"}
        />
      ) : (
        <span>{marks[variant]}</span>
      )}
    </div>
  );
}
