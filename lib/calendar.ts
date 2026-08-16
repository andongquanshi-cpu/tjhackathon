import type { DailyGuideProgress, Note, Profile } from "./types";

export interface CalendarDay {
  day: number;
  date: Date;
  isoDate: string;
  notes: Note[];
  guideProgress: DailyGuideProgress | null;
}

export function trainingDate(profile: Profile | null, day: number): Date {
  const start = profile ? new Date(profile.createdAt) : new Date();
  const date = new Date(start);
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + day - 1);
  return date;
}

export function localIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildTrainingCalendar(
  profile: Profile | null,
  notes: Note[],
  progress: DailyGuideProgress[]
): CalendarDay[] {
  return Array.from({ length: 21 }, (_, index) => {
    const day = index + 1;
    const date = trainingDate(profile, day);
    return {
      day,
      date,
      isoDate: localIsoDate(date),
      notes: notes.filter((note) => note.day === day),
      guideProgress: progress.find((item) => item.day === day) ?? null,
    };
  });
}
