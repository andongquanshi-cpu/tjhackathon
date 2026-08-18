"use client";

import Image from "next/image";

/**
 * 小愈奔跑加载动效：保留原图脚印，只给四个黑点做依次明暗变化。
 */
export default function XiaoyuRunLoader({
  size = "md",
  label = "加载中",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}) {
  const scale = size === "sm" ? 0.55 : size === "lg" ? 1.2 : 0.8;

  return (
    <div
      className={`xiaoyu-run ${className}`}
      role="status"
      aria-label={label}
      style={{ "--run-scale": scale } as React.CSSProperties}
    >
      <Image
        src="/decor/xiaoyu-run-clean.png"
        alt=""
        width={115}
        height={155}
        className="xiaoyu-run__char"
        draggable={false}
        priority
      />
      <div className="xiaoyu-run__prints" aria-hidden="true">
        <span className="xiaoyu-run__print is-p1" />
        <span className="xiaoyu-run__print is-p2" />
        <span className="xiaoyu-run__print is-p3" />
        <span className="xiaoyu-run__print is-p4" />
      </div>
    </div>
  );
}
