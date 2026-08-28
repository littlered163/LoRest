"use client";

// Self-contained, auth-free cover preview for the app card.
// Deterministic data only; never imports product routes, auth, or APIs.

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

export const COVER_PREVIEW_DATA = {
  brand: "LoRest · 孕 24 周",
  greeting: "早安，昨夜很稳。",
  score: 86,
  scoreLabel: "睡眠评分",
  hint: "慢慢醒来，身体正在恢复。",
  metrics: [
    { b: "7:12", s: "睡眠" },
    { b: "1:48", s: "深睡" },
    { b: "68", s: "心率" },
  ],
  stages: [
    { c: "#7F9AA6", g: 3 },
    { c: "#9CB79A", g: 5 },
    { c: "#E4CDA0", g: 2 },
    { c: "#9CB79A", g: 4 },
    { c: "rgba(180,168,158,0.5)", g: 1 },
    { c: "#7F9AA6", g: 2 },
  ],
};

/** Wrap the finished cover; signals capture readiness. */
export function EazoCoverReady({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.body.setAttribute("data-eazo-cover-ready", "1");
  }, []);
  return <div data-eazo-cover-ready-root>{children}</div>;
}

export function CoverPreview() {
  const d = COVER_PREVIEW_DATA;
  const [tick, setTick] = useState(0); // loop key
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<"draw" | "reveal">("draw");
  const raf = useRef<number | null>(null);

  useEffect(() => {
    // count-up over ~1.4s, driven entirely from the rAF callback so no
    // setState runs synchronously in the effect body.
    const dur = 1400;
    let start = 0;
    function step(now: number) {
      if (!start) start = now;
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setScore(Math.round(eased * d.score));
      if (p < 1) {
        raf.current = requestAnimationFrame(step);
      } else {
        setPhase("reveal");
      }
    }
    raf.current = requestAnimationFrame(step);
    const loop = setTimeout(() => {
      setScore(0);
      setPhase("draw");
      setTick((x) => x + 1);
    }, 4200);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      clearTimeout(loop);
    };
  }, [tick, d.score]);

  const circumference = 2 * Math.PI * 88;
  const dashTo = circumference * (1 - score / 100);

  return (
    <div
      className="relative grid h-[100svh] w-full place-items-center overflow-hidden px-6"
      style={{ background: "#F4EFE9", fontFamily: "Inter, system-ui, sans-serif", color: "#2D2521" }}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 30% 22%, rgba(156,183,154,.5), transparent 40%), radial-gradient(circle at 78% 60%, rgba(174,194,206,.42), transparent 45%), radial-gradient(circle at 50% 90%, rgba(228,205,160,.4), transparent 45%)",
        }}
      />
      <div className="relative w-full max-w-[360px]">
        <div className="text-[13px] text-[#8B817A]">{d.brand}</div>
        <div className="mt-1 text-[24px] font-semibold" style={{ fontFamily: "'Noto Serif SC', serif" }}>
          {d.greeting}
        </div>

        <div className="mt-4 grid place-items-center">
          <div className="relative grid h-[260px] w-[260px] place-items-center">
            <svg viewBox="0 0 220 220" className="absolute inset-0 h-full w-full" style={{ overflow: "visible" }} aria-hidden>
              <defs>
                <linearGradient id="cover-warm" x1="30" y1="20" x2="180" y2="200">
                  <stop stopColor="#9CB79A" />
                  <stop offset=".56" stopColor="#E4CDA0" />
                  <stop offset="1" stopColor="#AEC2CE" />
                </linearGradient>
              </defs>
              <circle cx="110" cy="110" r="88" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="15" />
              <circle
                cx="110"
                cy="110"
                r="88"
                fill="none"
                stroke="url(#cover-warm)"
                strokeWidth="15"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashTo}
                style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
              />
            </svg>
            <div
              className="grid place-items-center rounded-full text-center"
              style={{
                width: "62%",
                aspectRatio: "1",
                background: "radial-gradient(circle at 45% 35%, rgba(255,255,255,.95), rgba(255,252,248,.6) 48%, rgba(156,183,154,.25))",
                boxShadow: "inset 0 0 38px rgba(255,255,255,.72), 0 18px 46px rgba(150,116,92,.13)",
              }}
            >
              <div>
                <div className="text-[52px] font-bold leading-none" style={{ letterSpacing: "-.06em" }}>{score}</div>
                <div className="mt-2 text-[15px] text-[#766D66]" style={{ fontFamily: "'Noto Serif SC', serif" }}>{d.scoreLabel}</div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="mt-5 grid grid-cols-3 gap-2.5 transition-all duration-700"
          style={{ opacity: phase === "reveal" ? 1 : 0, transform: phase === "reveal" ? "translateY(0)" : "translateY(10px)" }}
        >
          {d.metrics.map((m) => (
            <div
              key={m.s}
              className="rounded-3xl px-2 py-3 text-center"
              style={{ background: "rgba(255,252,247,.7)", border: "1px solid rgba(101,78,67,.12)" }}
            >
              <b className="block text-[19px]" style={{ letterSpacing: "-.04em" }}>{m.b}</b>
              <span className="mt-1 block text-[11px] text-[#8B817A]">{m.s}</span>
            </div>
          ))}
        </div>

        <div
          className="mt-3 flex gap-[3px] transition-all duration-700"
          style={{ height: 22, opacity: phase === "reveal" ? 1 : 0 }}
        >
          {d.stages.map((s, i) => (
            <span key={i} className="rounded-full" style={{ flexGrow: s.g, flexBasis: 0, background: s.c }} />
          ))}
        </div>
      </div>
    </div>
  );
}
