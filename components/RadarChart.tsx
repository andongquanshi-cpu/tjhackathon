"use client";

import { SIX_DIM_META, type SixDimKey } from "@/lib/six-dim";

export default function RadarChart({
  values,
  size = 320,
  max = 20,
  threshold = 12,
}: {
  values: Record<SixDimKey, number>;
  size?: number;
  max?: number;
  threshold?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 44;
  const n = SIX_DIM_META.length;
  const ratioOf = (score: number) => Math.max(0, Math.min(1, score / max));

  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i: number, ratio: number): [number, number] => [
    cx + r * ratio * Math.cos(angle(i)),
    cy + r * ratio * Math.sin(angle(i)),
  ];

  const rings = [0.25, 0.5, 0.75, 1].map((ratio) =>
    SIX_DIM_META.map((_, i) => pt(i, ratio).join(",")).join(" ")
  );
  const thresholdPoints = SIX_DIM_META.map((_, i) =>
    pt(i, ratioOf(threshold)).join(",")
  ).join(" ");
  const valuePoints = SIX_DIM_META.map((d, i) =>
    pt(i, ratioOf(values[d.key] ?? 0)).join(",")
  ).join(" ");

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="六维心理画像雷达图"
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
      <polygon
        points={thresholdPoints}
        fill="none"
        stroke="#c4b59a"
        strokeWidth={1.5}
        strokeDasharray="4 4"
      />
      {SIX_DIM_META.map((_, i) => {
        const [x, y] = pt(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#e2e8f0" strokeWidth={1} />;
      })}
      <polygon
        points={valuePoints}
        fill="rgba(49,95,85,0.22)"
        stroke="#315f55"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {SIX_DIM_META.map((d, i) => {
        const [x, y] = pt(i, ratioOf(values[d.key] ?? 0));
        return <circle key={d.key} cx={x} cy={y} r={4} fill={d.color} stroke="#fff" strokeWidth={1.5} />;
      })}
      {SIX_DIM_META.map((d, i) => {
        const [x, y] = pt(i, 1.22);
        return (
          <text
            key={d.key}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={11}
            fill={d.color}
            fontWeight={600}
          >
            {d.label} {Math.round(values[d.key] ?? 0)}
          </text>
        );
      })}
    </svg>
  );
}
