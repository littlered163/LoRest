"use client";

import { STAGES, STAGE_COLORS, type StageSegment, type StageKind } from "@/lib/lorest/sleep";

// Vertical level per stage (higher = more awake), mirroring the clear
// stepped hypnogram in mainstream sleep apps. Deep sits lowest.
const LEVEL: Record<StageKind, number> = { awake: 3, rem: 2, light: 1, deep: 0 };
const LEVELS = 4;

/**
 * Stepped overnight hypnogram. Each stage becomes a flat horizontal bar at its
 * own level; the whole night reads as a clear staircase (deep → light → rem →
 * awake) instead of a row of tiny blocks. Colors follow the design palette.
 */
export function StageBand({
  segments = STAGES,
  height = 96,
}: {
  segments?: StageSegment[];
  height?: number;
}) {
  const total = segments.reduce((s, x) => s + x.minutes, 0) || 1;
  const W = 320;
  const H = 100;
  const padY = 8;
  const rowH = (H - padY * 2) / LEVELS;
  const barH = rowH * 0.62;
  // Center Y of a given level's bar (level 3 = top).
  const yOf = (lvl: number) => padY + (LEVELS - 1 - lvl) * rowH + (rowH - barH) / 2;

  // Precompute the start offset (in minutes) of each segment, then map to bars
  // without mutating any variable after render.
  const starts = segments.reduce<number[]>((acc, seg, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + segments[i - 1].minutes);
    return acc;
  }, []);
  const bars = segments.map((seg, i) => {
    const lvl = LEVEL[seg.kind];
    return {
      key: i,
      x: (starts[i] / total) * W,
      w: (seg.minutes / total) * W,
      y: yOf(lvl),
      kind: seg.kind,
    };
  });

  // Thin connectors between consecutive bars so the staircase reads continuously.
  const connectors = bars.slice(1).map((b, i) => {
    const prev = bars[i];
    const py = prev.y + barH / 2;
    const cy = b.y + barH / 2;
    return { key: `c${i}`, x: b.x, y1: Math.min(py, cy), y2: Math.max(py, cy) };
  });

  return (
    <div style={{ height }} data-el="sleep-stage-band">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="none" aria-hidden>
        {connectors.map((c) => (
          <rect
            key={c.key}
            x={c.x - 1}
            y={c.y1 + barH / 2}
            width={2}
            height={Math.max(0, c.y2 - c.y1)}
            fill="rgba(150,132,120,.28)"
          />
        ))}
        {bars.map((b) => (
          <rect
            key={b.key}
            x={b.x}
            y={b.y}
            width={Math.max(0, b.w - 1.5)}
            height={barH}
            rx={barH / 2}
            fill={STAGE_COLORS[b.kind]}
          />
        ))}
      </svg>
    </div>
  );
}

export function StageLegend({ labels }: { labels: Record<"deep" | "light" | "rem" | "awake", string> }) {
  const items: Array<{ k: keyof typeof labels; c: string }> = [
    { k: "awake", c: STAGE_COLORS.awake },
    { k: "rem", c: STAGE_COLORS.rem },
    { k: "light", c: STAGE_COLORS.light },
    { k: "deep", c: STAGE_COLORS.deep },
  ];
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {items.map(({ k, c }) => (
        <span key={k} className="flex items-center gap-1.5 text-xs text-[#776C66]">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} aria-hidden />
          {labels[k]}
        </span>
      ))}
    </div>
  );
}
