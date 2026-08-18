import Link from "next/link";
import AppNav from "@/components/AppNav";
import XiaoyuAvatar from "@/components/XiaoyuAvatar";
import { buildTrainingCalendar } from "@/lib/calendar";
import { currentDay, getGuideProgress, getNotes, getProfile } from "@/lib/store";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

export default function CalendarPage() {
  const profile = getProfile();
  const today = currentDay(profile);
  const days = buildTrainingCalendar(profile, getNotes(), getGuideProgress());
  const startOffset = days[0].date.getDay();
  const completeDays = days.filter((day) => day.guideProgress?.completedAt || day.notes.length).length;
  const startLabel = days[0].date.toLocaleDateString("zh-CN", { month: "long", day: "numeric" });
  const endLabel = days[20].date.toLocaleDateString("zh-CN", { month: "long", day: "numeric" });

  return (
    <main className="calendar-page min-h-screen">
      <AppNav day={today} />
      <section className="calendar-heading">
        <div>
          <span className="eyebrow">YOUR 21 DAYS</span>
          <h1>在Inside Out 走过的日子</h1>
          <p>{startLabel} — {endLabel} · 已留下 {completeDays} 天足迹</p>
        </div>
        <div className="calendar-legend">
          <span><i className="has-guide" /> 导单完成</span>
          <span><i className="has-note" /> 有记录</span>
          <span><i className="has-feedback" /> 有反馈</span>
        </div>
      </section>

      <section className="calendar-board">
        <div className="weekday-row">
          {WEEKDAYS.map((weekday) => <span key={weekday}>{weekday}</span>)}
        </div>
        <div className="calendar-grid">
          {Array.from({ length: startOffset }, (_, index) => <div key={`blank-${index}`} className="calendar-blank" />)}
          {days.map((entry) => {
            const latest = entry.notes[entry.notes.length - 1];
            const future = entry.day > today;
            return (
              <Link
                key={entry.day}
                href={`/calendar/${entry.day}`}
                className={`calendar-cell ${entry.day === today ? "is-today" : ""} ${future ? "is-future" : ""}`}
              >
                <header>
                  <b>{entry.date.getDate()}</b>
                  <span>DAY {entry.day}</span>
                </header>
                <div className="calendar-character">
                  {(entry.day === today || latest) && <XiaoyuAvatar variant="host" size="sm" />}
                </div>
                <footer>
                  <i className={entry.guideProgress?.completedAt ? "has-guide" : ""} />
                  <i className={latest ? "has-note" : ""} />
                  <i className={latest?.feedback ? "has-feedback" : ""} />
                </footer>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
