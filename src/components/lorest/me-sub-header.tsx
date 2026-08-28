"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LorestLangToggle } from "./lorest-lang-toggle";

/** Shared back-header for the "me" sub-pages. */
export function MeSubHeader({ title }: { title: string }) {
  return (
    <header className="mb-5 flex items-center gap-3">
      <Link
        href="/me"
        data-el="me-sub-back"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border"
        style={{ background: "rgba(255,255,255,.4)", backdropFilter: "blur(16px)" }}
        aria-label={title}
      >
        <ArrowLeft className="h-5 w-5 text-[#7D726D]" />
      </Link>
      <h1 className="flex-1 font-heading text-[26px] font-semibold leading-tight">{title}</h1>
      <LorestLangToggle />
    </header>
  );
}
