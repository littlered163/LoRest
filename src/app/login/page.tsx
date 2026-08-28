"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Leaf, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth, type User } from "@/lib/auth/local-auth";
import { ScreenShell } from "@/components/lorest/screen-shell";
import { LorestLangToggle } from "@/components/lorest/lorest-lang-toggle";

function makeToken(user: User): string {
  return Buffer.from(JSON.stringify(user)).toString("base64");
}

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, loading, login } = useAuth();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [user, loading, router]);

  const signIn = () => {
    if (!email.trim()) return;
    setBusy(true);
    const newUser: User = {
      id: btoa(email.trim()).replace(/[^a-zA-Z0-9]/g, "").slice(0, 32),
      email: email.trim(),
      name: name.trim() || null,
      avatarUrl: null,
    };
    const token = makeToken(newUser);
    login(newUser, token);
    router.replace("/");
    setBusy(false);
  };

  return (
    <ScreenShell withNav={false} label="荷眠登录">
      <div className="flex min-h-[calc(100svh-var(--safe-top)-var(--safe-bottom))] flex-col">
        <div className="flex justify-end pt-2">
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
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("login.namePlaceholder") || "昵称（可选）"}
            className="rounded-2xl border border-border bg-white/60 px-4 py-3 text-[15px] outline-none focus:border-[#AEC2CE]"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("login.emailPlaceholder") || "邮箱"}
            className="rounded-2xl border border-border bg-white/60 px-4 py-3 text-[15px] outline-none focus:border-[#AEC2CE]"
          />
          <button
            type="button"
            onClick={signIn}
            disabled={busy || !email.trim()}
            className="flex w-full items-center justify-center rounded-full py-3.5 text-[15px] font-semibold text-white transition-opacity disabled:opacity-60"
            style={{
              background: "linear-gradient(90deg,#AEC2CE,#9CB79A)",
              boxShadow: "0 10px 30px rgba(174,194,206,.4)",
            }}
          >
            {busy ? t("login.signingIn") : t("login.signIn")}
          </button>
          <p className="mt-1 text-center text-[12px] leading-[1.6] text-muted-foreground">
            {t("login.hint")}
          </p>
        </div>
      </div>
    </ScreenShell>
  );
}
