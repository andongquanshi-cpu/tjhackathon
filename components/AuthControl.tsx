"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { LocalUser } from "@/lib/types";

const STORAGE_KEY = "yuxingxiang-local-user";

export default function AuthControl({ compact = false }: { compact?: boolean }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      setUser(JSON.parse(raw) as LocalUser);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!user) {
      queueMicrotask(() => inputRef.current?.focus());
    }
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, user]);

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
    setOpen(false);
    setName("");
  };

  const dialog =
    open && mounted
      ? createPortal(
          <div
            className="auth-backdrop"
            role="presentation"
            onClick={(event) => {
              if (event.target === event.currentTarget) setOpen(false);
            }}
          >
            <div
              className="auth-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
            >
              <button type="button" onClick={() => setOpen(false)} className="auth-close">
                返回Inside Out
              </button>

              {user ? (
                <>
                  <span className="eyebrow">ACCOUNT</span>
                  <h2 id={titleId}>你好，{user.displayName}</h2>
                  <p>这是本地体验账号，只保存在这台浏览器中。</p>
                  <div className="auth-dialog__actions">
                    <button type="button" className="primary-pill" onClick={logout}>
                      退出登录
                    </button>
                  </div>
                </>
              ) : (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    login();
                  }}
                >
                  <span className="eyebrow">LOCAL PREVIEW</span>
                  <h2 id={titleId}>先告诉小愈，怎么称呼你？</h2>
                  <p>这是本地体验账号，只保存在这台浏览器中，不会创建真实账户或云端同步。</p>
                  <label>
                    <span>你的称呼</span>
                    <input
                      ref={inputRef}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      maxLength={16}
                      placeholder="例如：小林"
                    />
                  </label>
                  <div className="auth-dialog__actions">
                    <button type="submit" disabled={!name.trim()} className="primary-pill">
                      进入 INSIDE OUT →
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {user ? (
        <button
          type="button"
          className={`auth-trigger ${compact ? "is-compact" : ""}`}
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span className="auth-dot">{user.displayName.slice(0, 1)}</span>
          {!compact && <span>{user.displayName}</span>}
        </button>
      ) : (
        <button
          type="button"
          className={`auth-trigger ${compact ? "is-compact" : ""}`}
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span className="auth-dot" />
          {!compact && "登录 / 注册"}
        </button>
      )}
      {dialog}
    </>
  );
}
