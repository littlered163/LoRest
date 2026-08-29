"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Leaf, Sparkles, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth, type User } from "@/lib/auth/local-auth";
import { ScreenShell } from "@/components/lorest/screen-shell";
import { LorestLangToggle } from "@/components/lorest/lorest-lang-toggle";

function makeToken(user: User): string {
  return btoa(JSON.stringify(user));
}

type Mode = "choice" | "signin" | "register";

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, loading, login } = useAuth();
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<Mode>("choice");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [user, loading, router]);

  const submit = () => {
    if (!email.trim()) return;
    setBusy(true);
    const newUser: User = {
      id: btoa(email.trim()).replace(/[^a-zA-Z0-9]/g, "").slice(0, 32),
      email: email.trim(),
      name: name.trim() || null,
      avatarUrl: null,
    };
    login(newUser, makeToken(newUser));
    router.replace("/");
    setBusy(false);
  };

  const PRIMARY_BTN =
    "flex w-full items-center justify-center rounded-full py-3.5 text-[15px] font-semibold text-white transition-opacity disabled:opacity-60";
  const PRIMARY_STYLE = {
    background: "linear-gradient(90deg,#AEC2CE,#9CB79A)",
    boxShadow: "0 10px 30px rgba(174,194,206,.4)",
  } as const;

  return (
    <ScreenShell withNav={false} label="荷眠登录">
      <div className="flex min-h-[calc(100svh-var(--safe-top)-var(--safe-bottom))] flex-col">
        <div className="flex items-center justify-between pt-2">
          {mode !== "choice" ? (
            <button
              type="button"
              onClick={() => setMode("choice")}
              className="flex items-center gap-1 text-[13px] text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("login.backToChoice")}
            </button>
          ) : (
            <span />
          )}
          <LorestLangToggle />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <span
            className="grid h-20 w-20 place-items-center rounded-full"
            style={{
              background: "radial-gradient(circle,#fff,#9CB79A 60%,#E4CDA0)",
              boxShadow: "0 0 40px rgba(156,183,154,.6)",
              animation: "lorest-breathe 4.7s var(--lorest-ease) infinite alternate",
            }}
            aria-hidden
          >
            <Leaf className="h-8 w-8 text-white/90" />
          </span>

          <h1 className="font-heading mt-7 text-[28px] font-semibold leading-[1.2] text-[#5F554F]">
            {t("login.title")}
          </h1>
          <p className="mt-3 max-w-[19rem] text-[14px] leading-[1.7] text-[#776C66]">
            {t("login.subtitle")}
          </p>

          <ul className="mt-7 grid w-full max-w-[19rem] gap-2.5 text-left">
            {[t("login.perk1"), t("login.perk2"), t("login.perk3")].map((p) => (
              <li key={p} className="lorest-card flex items-center gap-2.5 px-3.5 py-3 text-[13px] text-[#6E625C]">
                <Sparkles className="h-4 w-4 shrink-0 text-[#C0972F]" aria-hidden />
                {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-3 pb-8">
          {mode === "choice" && (
            <>
              <button type="button" onClick={() => setMode("signin")} className={PRIMARY_BTN} style={PRIMARY_STYLE}>
                {t("login.signInBtn")}
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className="flex w-full items-center justify-center rounded-full border border-[#AEC2CE] py-3.5 text-[15px] font-semibold text-[#5F7C90] transition-opacity"
                style={{ background: "rgba(174,194,206,.15)" }}
              >
                {t("login.registerBtn")}
              </button>
            </>
          )}

          {(mode === "signin" || mode === "register") && (
            <>
              {mode === "register" && (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("login.namePlaceholder")}
                  className="rounded-2xl border border-border bg-white/60 px-4 py-3 text-[15px] outline-none focus:border-[#AEC2CE]"
                />
              )}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("login.emailPlaceholder")}
                className="rounded-2xl border border-border bg-white/60 px-4 py-3 text-[15px] outline-none focus:border-[#AEC2CE]"
                autoFocus
              />
              <button
                type="button"
                onClick={submit}
                disabled={busy || !email.trim()}
                className={PRIMARY_BTN}
                style={PRIMARY_STYLE}
              >
                {busy ? t("login.signingIn") : mode === "register" ? t("login.register") : t("login.signIn")}
              </button>
              <p className="mt-1 text-center text-[12px] leading-[1.6] text-muted-foreground">
                {t("login.hint")}
              </p>
            </>
          )}
        </div>
      </div>
    </ScreenShell>
  );
}
