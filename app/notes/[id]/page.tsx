import { notFound } from "next/navigation";
import NoteView from "@/components/NoteView";
import { getNote, getProfile } from "@/lib/store";

export default async function NotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const note = getNote(id);
  if (!note) notFound();
  return <NoteView initialNote={note} initialProfile={getProfile()} />;
}