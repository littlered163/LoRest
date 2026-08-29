"use client";

import type { ReactNode } from "react";
import { LorestAura } from "./lorest-aura";
import { BottomNav } from "./bottom-nav";

/**
 * Shared mobile shell: fixed warm-aura ground, centered phone column,
 * safe-area padding, and (optionally) the bottom tab bar.
 */
export function ScreenShell({
  children,
  withNav = true,
  label,
}: {
  children: ReactNode;
  withNav?: boolean;
  label?: string;
}) {
  return (
    <>
      <LorestAura />
      <main
        className="relative min-h-[100svh]"
        style={{
          paddingTop: "var(--safe-top)",
          paddingBottom: withNav ? "calc(var(--safe-bottom) + 156px)" : "var(--safe-bottom)",
          isolation: "isolate",
        }}
      >
        <div className="mx-auto w-full max-w-[440px] min-w-0 px-[22px]" aria-label={label}>
          {children}
        </div>
      </main>
      {withNav && <BottomNav />}
    </>
  );
}
