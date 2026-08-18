import type { ReactNode } from "react";

type ReplyBubbleProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  /** mentor | user | host */
  tone?: "mentor" | "user" | "host";
  /** 导师长回复用更大的气泡 */
  size?: "md" | "lg";
  className?: string;
};

export default function ReplyBubble({
  children,
  title,
  subtitle,
  tone = "mentor",
  size = "lg",
  className = "",
}: ReplyBubbleProps) {
  return (
    <div
      className={`reply-bubble reply-bubble--${tone} reply-bubble--${size} ${className}`.trim()}
    >
      <span className="reply-bubble__tail" aria-hidden="true" />
      {(title || subtitle) && (
        <header className="reply-bubble__head">
          {title && <strong>{title}</strong>}
          {subtitle && <small>{subtitle}</small>}
        </header>
      )}
      <div className="reply-bubble__body">{children}</div>
    </div>
  );
}
