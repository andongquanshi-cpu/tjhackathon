import type { MentorFeature } from "@/lib/mentors";

export default function MentorPortrait({
  feature,
  className = "",
}: {
  feature: MentorFeature;
  className?: string;
}) {
  return (
    <span className={`warm-home__portrait warm-home__portrait--${feature} ${className}`.trim()}>
      <span className="warm-home__face" aria-hidden="true">
        <span className="warm-home__hair" />
        <span className="warm-home__eye warm-home__eye--left" />
        <span className="warm-home__eye warm-home__eye--right" />
        <span className="warm-home__glasses" />
        <span className="warm-home__nose" />
        <span className="warm-home__mouth" />
        <span className="warm-home__beard" />
        <span className="warm-home__chin" />
      </span>
    </span>
  );
}
