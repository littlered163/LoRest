"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth, type User } from "@/lib/auth/local-auth";
import { ScreenShell } from "@/components/lorest/screen-shell";
import { LorestLangToggle } from "@/components/lorest/lorest-lang-toggle";

const DEMO_USER: User = {
  id: "roadshow-demo-01",
  email: "demo@lorest.lialab.cn",
  name: "路演体验官",
  avatarUrl: null,
};

function makeToken(user: User): string {
  return btoa(JSON.stringify(user));
}

function LorestLeafMark() {
  return (
    <svg viewBox="0 0 80 80" className="h-24 w-24" role="img" aria-label="LoRest">
      <defs>
        <radialGradient id="leaf-mark-bg" cx="50%" cy="46%" r="58%">
          <stop offset="0%" stopColor="#f8fff6" stopOpacity="0.96" />
          <stop offset="62%" stopColor="#bad4b5" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#8fb287" stopOpacity="0.95" />
        </radialGradient>
        <filter id="leaf-mark-soft" x="-18%" y="-18%" width="136%" height="136%">
          <feGaussianBlur stdDeviation="0.45" />
        </filter>
      </defs>
      <circle cx="40" cy="40" r="34" fill="url(#leaf-mark-bg)" />
      <path
        d="M27.5 52.5C30.2 40.4 39.8 35.6 52.4 30.1C51.5 39.7 47.5 48.3 38.3 50.8C34.5 51.8 30.9 51.6 27.5 52.5Z"
        fill="none"
        stroke="white"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#leaf-mark-soft)"
      />
      <path
        d="M27.5 52.5C34.2 45.3 41.5 41 50.9 36.8"
        fill="none"
        stroke="white"
        strokeWidth="3.4"
        strokeLinecap="round"
        filter="url(#leaf-mark-soft)"
      />
    </svg>
  );
}

async function warmDemoData(token: string) {
  const headers = { "x-lorest-session": token, "content-type": "application/json" };
  await fetch("/api/user/profile", { headers });
  await fetch("/api/pregnancy/profile", {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      week: 28,
      dueDate: "2026-11-18",
      weightKg: "62.5",
      mood: "calm",
      onboarded: true,
    }),
  });
  await Promise.all([
    fetch("/api/pregnancy/todos", { headers }),
    fetch("/api/pregnancy/checkups", { headers }),
  ]);
}

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, loading, login } = useAuth();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [user, loading, router]);

  async function startDemo() {
    setBusy(true);
    const token = makeToken(DEMO_USER);
    login(DEMO_USER, token);
    try {
      await warmDemoData(token);
    } catch {
      // The demo can still run with deterministic local sleep data if seeding is slow.
    }
    router.replace("/");
  }

  return (
    <ScreenShell withNav={false} label="荷眠体验">
      <div className="flex min-h-[calc(100svh-var(--safe-top)-var(--safe-bottom))] flex-col">
        <div className="flex justify-end pt-2">
          <LorestLangToggle />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <span
            className="grid h-28 w-28 place-items-center"
            style={{ animation: "lorest-breathe 4.7s var(--lorest-ease) infinite alternate" }}
          >
            <LorestLeafMark />
          </span>

          <h1 className="font-heading mt-7 text-[28px] font-semibold leading-[1.2] text-[#5F554F]">
            {t("login.title")}
          </h1>
          <p className="mt-3 max-w-[19rem] text-[14px] leading-[1.7] text-[#776C66]">
            {t("login.subtitle")}
          </p>

          <ul className="mt-7 grid w-full max-w-[19rem] gap-2.5 text-left">
            {[t("login.perk1"), t("login.perk2"), t("login.perk3")].map((p) => (
              <li
                key={p}
                className="lorest-card flex items-center gap-2.5 px-3.5 py-3 text-[13px] text-[#6E625C]"
              >
                <Sparkles className="h-4 w-4 shrink-0 text-[#C0972F]" aria-hidden />
                {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-3 pb-8" data-el="login-demo-entry">
          <button
            type="button"
            onClick={() => void startDemo()}
            disabled={busy}
            className="flex w-full items-center justify-center rounded-full py-3.5 text-[15px] font-semibold text-white transition-opacity disabled:opacity-60"
            style={{
              background: "linear-gradient(90deg,#AEC2CE,#9CB79A)",
              boxShadow: "0 10px 30px rgba(174,194,206,.4)",
            }}
          >
            {busy ? t("login.demoEntering") : t("login.demoStart")}
          </button>
          <p className="mt-1 text-center text-[12px] leading-[1.6] text-muted-foreground">
            {t("login.demoHint")}
          </p>
        </div>
      </div>
    </ScreenShell>
  );
}
