import Image from "next/image";
import { personaImageSrc } from "@/lib/six-dim";

type Size = "md" | "lg";

const SIZE_PX = {
  md: { w: 120, h: 160 },
  lg: { w: 220, h: 293 },
} as const;

export default function PersonaPortrait({
  personaId,
  personaName,
  size = "lg",
  className = "",
}: {
  personaId?: number | null;
  personaName?: string | null;
  size?: Size;
  className?: string;
}) {
  const src = personaImageSrc(personaId, personaName);
  if (!src) return null;
  const px = SIZE_PX[size];

  return (
    <figure className={`persona-portrait persona-portrait--${size} ${className}`.trim()}>
      <Image
        src={src}
        alt={personaName ? `「${personaName}」画像` : "人格画像"}
        width={px.w}
        height={px.h}
        className="persona-portrait__img"
        draggable={false}
        priority={size === "lg"}
      />
    </figure>
  );
}
