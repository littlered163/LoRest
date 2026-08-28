"use client";

// Fixed lotus-inspired ambient ground shared across every LoRest screen.
// Soft low-saturation green glow + a faint lotus-leaf vein motif, matching
// the pregnancy-lotus brand direction. No external image dependency.

export function LorestAura() {
  return (
    <>
      <div className="lorest-aura" aria-hidden>
        {/* Faint lotus-leaf silhouette with radial veins, drifting near the top */}
        <svg
          viewBox="0 0 400 400"
          className="absolute left-1/2 top-[5%] h-[64vw] max-h-[300px] w-[64vw] max-w-[300px] -translate-x-1/2"
          style={{ opacity: 0.13 }}
          aria-hidden
        >
          <defs>
            <radialGradient id="lorest-leaf-fill" cx="50%" cy="46%" r="54%">
              <stop offset="0%" stopColor="#BFD4B8" />
              <stop offset="70%" stopColor="#9CB79A" />
              <stop offset="100%" stopColor="#6E8F6A" />
            </radialGradient>
          </defs>
          {/* Round lotus leaf with the classic single notch at the top */}
          <path
            d="M200 40 C300 40 360 118 360 200 C360 292 286 360 200 360 C114 360 40 292 40 200 C40 118 100 40 200 40 Z M200 200 L214 62 C206 60 194 60 186 62 Z"
            fill="url(#lorest-leaf-fill)"
            fillRule="evenodd"
          />
          {/* Radial veins from the center */}
          <g stroke="#5F8A5C" strokeWidth="1.4" opacity="0.5" fill="none">
            {Array.from({ length: 14 }).map((_, i) => {
              const a = (i / 14) * Math.PI * 2 - Math.PI / 2;
              return (
                <line
                  key={i}
                  x1={200}
                  y1={200}
                  x2={200 + Math.cos(a) * 150}
                  y2={200 + Math.sin(a) * 150}
                />
              );
            })}
          </g>
        </svg>
      </div>
      <div
        className="lorest-orb"
        aria-hidden
        style={{ width: 230, height: 230, left: -70, top: "18%", background: "var(--lorest-primary)" }}
      />
      <div
        className="lorest-orb"
        aria-hidden
        style={{ width: 210, height: 210, right: -82, top: "30%", background: "var(--lorest-secondary)", animationDelay: "-2s" }}
      />
      <div
        className="lorest-orb"
        aria-hidden
        style={{ width: 190, height: 190, left: "38%", bottom: "14%", background: "var(--lorest-deep)", animationDelay: "-4s" }}
      />
    </>
  );
}
