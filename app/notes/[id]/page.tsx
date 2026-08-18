import { notFound } from "next/navigation";
import NoteView from "@/components/NoteView";
import { SCHOOL_IDS } from "@/lib/personas";
import { getNote, getProfile } from "@/lib/store";
import type { SchoolId } from "@/lib/types";

export default async function NotePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ school?: string; invite?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const note = getNote(id);
  if (!note) notFound();
  const school =
    typeof query.school === "string" && SCHOOL_IDS.includes(query.school as SchoolId)
      ? (query.school as SchoolId)
      : note.selectedSchool ?? null;
  const invite = query.invite === "1";
  return (
    <NoteView
      initialNote={note}
      initialProfile={getProfile()}
      initialSchool={school}
      inviteFromLanding={invite}
    />
  );
}