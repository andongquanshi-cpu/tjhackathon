import { currentDay, getNotes, getProfile } from "@/lib/store";
import HomeLanding from "@/components/HomeLanding";

export default function Home() {
  const profile = getProfile();
  const notes = getNotes();
  const day = currentDay(profile);

  return <HomeLanding hasProfile={Boolean(profile)} day={day} notesCount={notes.length} />;
}