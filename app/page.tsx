import Link from "next/link";
import { DIM_META } from "@/lib/assessment";
import { XIAOYU } from "@/lib/personas";
import { currentDay, getNotes, getProfile } from "@/lib/store";
import DemoButtons from "@/components/DemoButtons";

export default function Home() {
  const profile = getProfile();
  const notes = getNotes();
  const day = currentDay(profile);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 py-12 text-center">
      <div className="fade-up">
        <div
          className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full text-5xl shadow-lg ring-4 ring-white bg-gradient-to-br ${XIAOYU.gradient}`}
        >
          {XIAOYU.emoji}
        </div>
        <h1 className="mt-6 text-3xl font-bold text-slate-800">
          愈星乡 · 21 天正念训练营
        </h1>
        <p className="mt-3 text-slate-500">
          我是{ XIAOYU.name }。接下来的 21 天，我陪你每天写下一张便签，
          <br />
          再请四位流派伙伴从不同角度回应你，让内心慢慢被看见。
        </p>
      </div>

      {profile ? (
        <div className="fade-up mt-10 w-full max-w-md rounded-3xl bg-white/80 p-6 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-600">训练营第 {day} 天</span>
            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs text-teal-700">
              已写 {notes.length} 张便签
            </span>
          </div>
          <div className="mt-4 grid grid-cols-5 gap-1">
            {DIM_META.map((d) => (
              <div key={d.key} className="text-center">
                <div className="text-[10px] text-slate-400">{d.label}</div>
                <div className="text-sm font-semibold" style={{ color: d.color }}>
                  {Math.round(profile.dimensions[d.key])}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-2.5">
            <Link
              href="/journal"
              className="rounded-full bg-teal-600 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-teal-500"
            >
              写今天的便签 →
            </Link>
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/profile"
                className="rounded-full bg-white py-2.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
              >
                我的画像
              </Link>
              <Link
                href="/summary"
                className="rounded-full bg-white py-2.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
              >
                阶段总结
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="fade-up mt-10 flex flex-col items-center gap-4">
          <Link
            href="/assessment"
            className="rounded-full bg-teal-600 px-8 py-3 text-base font-medium text-white shadow-md transition hover:bg-teal-500"
          >
            开始 21 天之旅 · 先做个测评 →
          </Link>
          <p className="text-xs text-slate-400">约 2 分钟，5 个维度，帮你建立伊始画像</p>
        </div>
      )}

      <div className="mt-12">
        <DemoButtons />
      </div>
    </main>
  );
}