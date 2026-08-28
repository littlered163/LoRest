"use client";

/** Soft animated sleep-score ring with the design's warm gradient. */
export function ScoreRing({
  score,
  label,
  size = 224,
  onClick,
}: {
  score: number;
  label: string;
  size?: number;
  onClick?: () => void;
}) {
  const circumference = 2 * Math.PI * 88; // r = 88
  const dashTo = circumference * (1 - score / 100);
  const Wrapper: "button" | "div" = onClick ? "button" : "div";

  return (
    <Wrapper
      onClick={onClick}
      data-el="sleep-score-ring"
      className="relative grid place-items-center bg-transparent p-0"
      style={{
        width: `min(78vw, ${size}px)`,
        aspectRatio: "1",
        border: 0,
        cursor: onClick ? "pointer" : "default",
        WebkitTapHighlightColor: "transparent",
      }}
      aria-label={`${label} ${score}`}
    >
      <svg
        viewBox="0 0 220 220"
        className="absolute inset-0 h-full w-full"
        style={{ overflow: "visible", filter: "drop-shadow(0 24px 42px rgba(139,105,87,.12))" }}
        aria-hidden
      >
        <defs>
          <linearGradient id="lorest-warm" x1="30" y1="20" x2="180" y2="200">
            <stop stopColor="#9CB79A" />
            <stop offset=".56" stopColor="#E4CDA0" />
            <stop offset="1" stopColor="#AEC2CE" />
          </linearGradient>
        </defs>
        <circle cx="110" cy="110" r="88" fill="none" stroke="rgba(255,255,255,.58)" strokeWidth="15" />
        <circle
          cx="110"
          cy="110"
          r="88"
          fill="none"
          stroke="url(#lorest-warm)"
          strokeWidth="15"
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={
            {
              strokeDashoffset: circumference,
              transform: "rotate(-90deg)",
              transformOrigin: "50% 50%",
              animation: "lorest-draw 1.6s .25s var(--lorest-ease) forwards",
              // custom prop consumed by the keyframe
              ["--dash-to" as string]: `${dashTo}`,
            } as React.CSSProperties
          }
        />
      </svg>
      <div
        className="grid place-items-center text-center"
        style={{
          width: "62%",
          aspectRatio: "1",
          borderRadius: 9999,
          background:
            "radial-gradient(circle at 45% 35%, rgba(255,255,255,.92), rgba(255,252,248,.58) 48%, rgba(156,183,154,.25))",
          boxShadow: "inset 0 0 38px rgba(255,255,255,.72), 0 18px 46px rgba(150,116,92,.13)",
        }}
      >
        <div>
          <div className="text-[40px] font-bold leading-none" style={{ letterSpacing: "-.06em" }}>
            {score}
          </div>
          <div className="font-heading mt-1.5 text-[13px] text-[#766D66]">{label}</div>
        </div>
      </div>
    </Wrapper>
  );
}
