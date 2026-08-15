import type { SchoolPersona } from "@/lib/personas";

export default function SchoolAvatar({
  persona,
  size = "md",
}: {
  persona: SchoolPersona;
  size?: "sm" | "md" | "lg";
}) {
  const cls =
    size === "lg" ? "h-14 w-14 text-2xl" : size === "sm" ? "h-8 w-8 text-base" : "h-11 w-11 text-xl";
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full border-2 border-white shadow ${cls}`}
      style={{ background: `linear-gradient(135deg, ${persona.color}22, ${persona.color}44)` }}
      title={`${persona.name} · ${persona.school}`}
    >
      <span>{persona.emoji}</span>
    </div>
  );
}