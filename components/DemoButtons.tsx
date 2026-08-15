"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DemoButtons() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const run = async (seed: boolean) => {
    setBusy(true);
    try {
      await fetch("/api/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3 text-xs text-slate-400">
      <button onClick={() => run(true)} disabled={busy} className="underline hover:text-teal-600 disabled:opacity-50">
        载入演示数据
      </button>
      <span>·</span>
      <button onClick={() => run(false)} disabled={busy} className="underline hover:text-rose-500 disabled:opacity-50">
        清空数据
      </button>
    </div>
  );
}