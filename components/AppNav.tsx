"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthControl from "./AuthControl";

const LINKS = [
  { href: "/journal", label: "主界面" },
  { href: "/guide", label: "每日导单" },
  { href: "/calendar", label: "21 天月历" },
  { href: "/profile", label: "画像" },
];

export default function AppNav({ day }: { day?: number }) {
  const pathname = usePathname();
  return (
    <header className="app-nav">
      <Link href="/" className="app-brand">
        <span>愈</span>
        <b>愈星乡</b>
      </Link>
      <nav aria-label="应用导航">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={pathname.startsWith(link.href) ? "page" : undefined}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="app-nav-meta">
        {day && <span>DAY {day}/21</span>}
        <AuthControl compact />
      </div>
    </header>
  );
}
