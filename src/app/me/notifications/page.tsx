"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BedDouble, CalendarCheck, FileBarChart } from "lucide-react";
import { toast } from "sonner";
import { useEazo } from "@eazo/sdk/react";
import { ScreenShell } from "@/components/lorest/screen-shell";
import { MeSubHeader } from "@/components/lorest/me-sub-header";
import { fetchPrefs, savePrefs, type NotificationPrefKey } from "@/lib/api";

const ROWS: Array<{ key: NotificationPrefKey; Icon: typeof BedDouble }> = [
  { key: "bedtime", Icon: BedDouble },
  { key: "checkup", Icon: CalendarCheck },
  { key: "weekly", Icon: FileBarChart },
];

export default function NotificationsPage() {
  const { t } = useTranslation();
  const user = useEazo((s) => s.auth.user);
  const [prefs, setPrefs] = useState({ bedtime: true, checkup: true, weekly: true });

  useEffect(() => {
    if (!user) return;
    let active = true;
    fetchPrefs()
      .then((p) => active && setPrefs({ bedtime: p.bedtime, checkup: p.checkup, weekly: p.weekly }))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [user]);

  async function toggle(key: NotificationPrefKey) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    if (user) {
      await savePrefs({ [key]: next[key] }).catch(() => {
        setPrefs(prefs);
        toast.error(t("common.saveFailed"));
      });
    }
  }

  return (
    <ScreenShell label="通知提醒">
      <MeSubHeader title={t("notify.title")} />

      {!user && <p className="mb-4 px-1 text-[12px] text-muted-foreground">{t("notify.signInTip")}</p>}

      <section className="lorest-card overflow-hidden p-0" data-el="notify-rows">
        {ROWS.map(({ key, Icon }, i) => (
          <div
            key={key}
            className="flex items-center gap-3 px-[18px] py-4"
            style={i > 0 ? { borderTop: "1px solid var(--border)" } : undefined}
          >
            <Icon className="h-4.5 w-4.5 text-[#9A8E86]" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="text-[15px] text-[#5F554F]">{t(`notify.${key}`)}</div>
              <div className="mt-0.5 text-[12px] text-muted-foreground">{t(`notify.${key}Sub`)}</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs[key]}
              onClick={() => void toggle(key)}
              data-el={`notify-switch-${key}`}
              className="relative h-7 w-12 shrink-0 rounded-full transition-colors"
              style={{ background: prefs[key] ? "linear-gradient(90deg,#AEC2CE,#9CB79A)" : "rgba(150,132,120,.22)" }}
            >
              <span
                className="absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all"
                style={{ left: prefs[key] ? 24 : 4 }}
              />
            </button>
          </div>
        ))}
      </section>

      <p className="mt-4 px-1 text-[12px] leading-[1.6] text-muted-foreground">{t("notify.note")}</p>
    </ScreenShell>
  );
}
