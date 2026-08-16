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

export default function XiaoyuAvatar({
  variant,
  size = "md",
  className = "",
}: {
  variant: Variant;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  return (
    <div
      className={`xiaoyu-avatar xiaoyu-${size} ${tones[variant]} ${className}`}
      aria-label={variant === "reader" ? "用户形象" : `小愈·${marks[variant]}`}
    >
      <span>{marks[variant]}</span>
    </div>
  );
}
