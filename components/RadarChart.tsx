"use client";

import { DIM_META } from "@/lib/assessment";
import type { DimKey } from "@/lib/types";

export default function RadarChart({
  values,
  size = 320,
}: {
  values: Record<DimKey, number>;
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 44;
  const n = DIM_META.length;

  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i: number, ratio: number): [number, number] => [
    cx + r * ratio * Math.cos(angle(i)),
    cy + r * ratio * Math.sin(angle(i)),
  ];

  const rings = [0.25, 0.5, 0.75, 1].map((ratio) =>
    DIM_META.map((_, i) => pt(i, ratio).join(",")).join(" ")
  );

  const valuePoints = DIM_META.map((d, i) => pt(i, values[d.key] / 100).join(",")).join(
    " "
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="心理画像雷达图"
      className="mx-auto"
    >
      {rings.map((points, i) => (
        <polygon
          key={i}
          points={points}
          fill="none"
          stroke={i === rings.length - 1 ? "#94a3b8" : "#e2e8f0"}
          strokeWidth={i === rings.length - 1 ? 1.5 : 1}
        />
      ))}
      {DIM_META.map((_, i) => {
        const [x, y] = pt(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#e2e8f0" strokeWidth={1} />;
      })}
      <polygon
        points={valuePoints}
        fill="rgba(16,185,129,0.25)"
        stroke="#10b981"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {DIM_META.map((d, i) => {
        const [x, y] = pt(i, values[d.key] / 100);
        return <circle key={d.key} cx={x} cy={y} r={4} fill={d.color} stroke="#fff" strokeWidth={1.5} />;
      })}
      {DIM_META.map((d, i) => {
        const [x, y] = pt(i, 1.22);
        return (
          <text
            key={d.key}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={12}
            fill={d.color}
            fontWeight={600}
          >
            {d.label} {Math.round(values[d.key])}
          </text>
        );
      })}
    </svg>
  );
}