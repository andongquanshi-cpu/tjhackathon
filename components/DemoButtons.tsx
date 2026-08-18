"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const INTRO_KEY = "yuxingxiang-journal-intro-seen";
const DRAFT_KEY = "yuxingxiang-sixdim-draft";
const USER_KEY = "yuxingxiang-local-user";

export default function DemoButtons() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const clearClientState = (opts?: { clearUser?: boolean }) => {
    window.localStorage.removeItem(INTRO_KEY);
    window.localStorage.removeItem(DRAFT_KEY);
    if (opts?.clearUser) window.localStorage.removeItem(USER_KEY);
  };

  const run = async (mode: "seed" | "empty" | "first-visit") => {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed: mode === "seed" }),
      });

      if (mode === "first-visit") {
        clearClientState({ clearUser: true });
        router.push("/journal");
        router.refresh();
        return;
      }

      if (mode === "empty") clearClientState();
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="demo-buttons" aria-label="演示控制">
      <button type="button" onClick={() => run("first-visit")} disabled={busy}>
        模拟首次登陆
      </button>
      <span>·</span>
      <button type="button" onClick={() => run("seed")} disabled={busy}>
        载入演示数据
      </button>
      <span>·</span>
      <button type="button" onClick={() => run("empty")} disabled={busy}>
        清空数据
      </button>
    </div>
  );
}
