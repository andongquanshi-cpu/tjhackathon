"use client";

import { useEffect, useState } from "react";
import type { LocalUser } from "@/lib/types";

const STORAGE_KEY = "yuxingxiang-local-user";

export default function AuthControl({ compact = false }: { compact?: boolean }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      setUser(JSON.parse(raw) as LocalUser);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const login = () => {
    const displayName = name.trim();
    if (!displayName) return;
    const next = { displayName, createdAt: new Date().toISOString() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setUser(next);
    setOpen(false);
    setName("");
  };

  const logout = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <>
      {user ? (
        <div className={`auth-user ${compact ? "is-compact" : ""}`}>
          <span className="auth-dot">{user.displayName.slice(0, 1)}</span>
          {!compact && <span>{user.displayName}</span>}
          <button onClick={logout}>退出</button>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className={`auth-trigger ${compact ? "is-compact" : ""}`}>
          <span className="auth-dot" />
          {!compact && "登录 / 注册"}
        </button>
      )}

      {open && (
        <div className="auth-backdrop" role="dialog" aria-modal="true" aria-labelledby="auth-title">
          <form
            className="auth-dialog"
            onSubmit={(event) => {
              event.preventDefault();
              login();
            }}
          >
            <button type="button" onClick={() => setOpen(false)} className="auth-close">关闭 ×</button>
            <span className="eyebrow">LOCAL PREVIEW</span>
            <h2 id="auth-title">先告诉小愈，怎么称呼你？</h2>
            <p>这是本地体验账号，只保存在这台浏览器中，不会创建真实账户或云端同步。</p>
            <label>
              <span>你的称呼</span>
              <input
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={16}
                placeholder="例如：小林"
              />
            </label>
            <button type="submit" disabled={!name.trim()} className="primary-pill">进入愈星乡 →</button>
          </form>
        </div>
      )}
    </>
  );
}
