"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthControl from "./AuthControl";

const LINKS = [
  { href: "/journal", label: "主界面" },
  { href: "/calendar", label: "21 天日历" },
  { href: "/profile", label: "画像" },
];

export default function AppNav({ day }: { day?: number }) {
  const pathname = usePathname();
  return (
    <header className="app-nav">
      <Link href="/" className="app-brand">
        <span className="app-brand__mark" aria-hidden="true">
          <svg className="app-brand__badge" viewBox="0 0 36 36">
            <path
              fill="currentColor"
              fillRule="evenodd"
              d="M18 0c9.94 0 18 8.06 18 18s-8.06 18-18 18S0 27.94 0 18 8.06 0 18 0Zm.05 26.4
                 c-.9-1.05-3.55-3.7-6.2-6.95
                 C9.2 16.1 7.55 13.55 7.6 10.85
                 c.06-2.7 2.1-4.7 4.75-4.55
                 c1.9.1 3.2 1.2 4.2 2.95
                 .45-1.55 1.85-2.95 4.2-2.8
                 c2.85.2 4.9 2.35 4.85 5.15
                 -.05 2.85-1.95 5.6-4.7 8.7
                 -1.85 2.1-3.55 4.35-4.85 6.1Z"
            />
          </svg>
        </span>
        <b>INSIDE OUT</b>
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
