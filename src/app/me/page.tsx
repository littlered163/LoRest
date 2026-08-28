"use client";

import { useEffect, useState } from "react";
import {
  ChevronRight,
  Leaf,
  Lock,
  BellRing,
  Info,
  UserRound,
  LogOut,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { useAuth } from "@/lib/auth/local-auth";
import { ScreenShell } from "@/components/lorest/screen-shell";
import { LorestLangToggle } from "@/components/lorest/lorest-lang-toggle";
import { DEFAULT_DUE_DATE, displayName } from "@/lib/lorest/sleep";
import { fetchProfile } from "@/lib/api";

export default function MePage() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const name = displayName(user);

  const [week, setWeek] = useState(24);
  const [dueDate, setDueDate] = useState(DEFAULT_DUE_DATE);

  useEffect(() => {
    if (!user) return;
    let active = true;
    fetchProfile()
      .then((p) => {
        if (!active) return;
        setWeek(p.week);
        setDueDate(p.dueDate);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [user]);

  const rows = [
    { key: "sectionPregnancy", Icon: Leaf, href: "/me/pregnancy" },
    { key: "sectionNotify", Icon: BellRing, href: "/me/notifications" },
    { key: "sectionPrivacy", Icon: Lock, href: "/me/privacy" },
    { key: "sectionAbout", Icon: Info, href: "/me/about" },
  ] as const;

  return (
    <ScreenShell label="我的">
      <header className="mb-5 flex items-start justify-between gap-4">
        <h1 className="font-heading text-[28px] font-semibold leading-tight">{t("me.title")}</h1>
        <LorestLangToggle />
      </header>

      <section className="lorest-card lorest-card-strong flex items-center gap-4 p-[18px]" data-el="me-profile">
        <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full" style={{ background: "radial-gradient(circle,#fff,#9CB79A 70%,#E4CDA0)" }}>
          {user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl.startsWith("//") ? `https:${user.avatarUrl}` : user.avatarUrl} alt="" className="h-16 w-16 object-cover" />
          ) : (
            <UserRound className="h-7 w-7 text-white/90" aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-heading text-[19px]">
            {user ? name || t("me.profileName") : t("me.guestName")}
          </div>
          <div className="mt-0.5 text-[13px] text-muted-foreground">
            {t("me.profileWeek", { week, due: dueDate })}
          </div>
          {!user && (
            <Link
              href="/login"
              data-el="me-sign-in"
              className="mt-2 inline-block rounded-full px-4 py-1.5 text-xs font-medium text-white"
              style={{ background: "linear-gradient(120deg,#9CB79A,#E4CDA0)" }}
            >
              {t("common.signIn")}
            </Link>
          )}
        </div>
      </section>

      {!user && (
        <p className="mt-2 px-1 text-[12px] text-muted-foreground">{t("me.signInTip")}</p>
      )}

      <section className="lorest-card mt-4 overflow-hidden p-0" data-el="me-settings">
        {rows.map(({ key, Icon, href }, i) => (
          <Link
            key={key}
            href={href}
            className="flex w-full items-center gap-3 px-[18px] py-4 text-left"
            style={i > 0 ? { borderTop: "1px solid var(--border)" } : undefined}
            data-el={`me-row-${key}`}
          >
            <Icon className="h-4.5 w-4.5 text-[#9A8E86]" aria-hidden />
            <span className="flex-1 text-[15px] text-[#5F554F]">{t(`me.${key}`)}</span>
            <ChevronRight className="h-5 w-5 text-[#B7ADA6]" aria-hidden />
          </Link>
        ))}
      </section>

      {user && (
        <button
          type="button"
          onClick={() => logout()}
          data-el="me-sign-out"
          className="lorest-card mt-4 flex w-full items-center justify-center gap-2 px-[18px] py-4 text-[15px] font-medium text-[#C9857B]"
        >
          <LogOut className="h-4.5 w-4.5" aria-hidden />
          {t("common.signOut")}
        </button>
      )}

      <p className="mt-4 px-1 text-center text-[12px] leading-[1.6] text-muted-foreground" data-el="me-privacy-note">
        {t("me.privacyNote")}
      </p>
    </ScreenShell>
  );
}
