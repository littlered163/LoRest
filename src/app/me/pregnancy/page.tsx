"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useEazo } from "@eazo/sdk/react";
import { ScreenShell } from "@/components/lorest/screen-shell";
import { MeSubHeader } from "@/components/lorest/me-sub-header";
import { TOTAL_WEEKS, DEFAULT_DUE_DATE } from "@/lib/lorest/sleep";
import { fetchProfile, saveProfile } from "@/lib/api";

const MOODS = ["😊", "😌", "🥱", "😣", "🤗"];

export default function PregnancySettingsPage() {
  const { t } = useTranslation();
  const user = useEazo((s) => s.auth.user);

  const [week, setWeek] = useState(24);
  const [dueDate, setDueDate] = useState(DEFAULT_DUE_DATE);
  const [weightKg, setWeightKg] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    fetchProfile()
      .then((p) => {
        if (!active) return;
        setWeek(p.week);
        setDueDate(p.dueDate);
        setWeightKg(p.weightKg ?? "");
        setMood(p.mood);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [user]);

  async function onSave() {
    if (!user) {
      toast.error(t("meSettings.signInFirst"));
      return;
    }
    setSaving(true);
    try {
      await saveProfile({
        week,
        dueDate,
        weightKg: weightKg === "" ? undefined : weightKg,
        mood: mood ?? undefined,
      });
      toast.success(t("common.saved"));
    } catch {
      toast.error(t("common.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenShell label="孕期设置">
      <MeSubHeader title={t("meSettings.title")} />

      {!user && <p className="mb-4 px-1 text-[12px] text-muted-foreground">{t("meSettings.signInFirst")}</p>}

      <section className="lorest-card lorest-card-strong grid gap-5 p-[18px]" data-el="me-pregnancy-form">
        <label className="grid gap-2">
          <span className="text-[13px] text-[#6E625C]">{t("meSettings.dueDate")}</span>
          <input
            type="text"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            placeholder="12月17日"
            className="rounded-2xl border border-border bg-white/60 px-4 py-3 text-[15px] outline-none focus:border-[#AEC2CE]"
          />
        </label>

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[#6E625C]">{t("meSettings.week")}</span>
            <span className="font-heading text-[16px] text-[#8E6A5E]">{t("meSettings.weekValue", { week })}</span>
          </div>
          <input
            type="range"
            min={4}
            max={TOTAL_WEEKS}
            value={week}
            onChange={(e) => setWeek(Number(e.target.value))}
            className="w-full accent-[#AEC2CE]"
            data-el="me-week-slider"
          />
        </div>

        <label className="grid gap-2">
          <span className="text-[13px] text-[#6E625C]">{t("meSettings.weight")}</span>
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-white/60 px-4 py-3">
            <input
              type="number"
              inputMode="decimal"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="—"
              className="w-full bg-transparent text-[15px] outline-none"
            />
            <span className="text-[13px] text-muted-foreground">kg</span>
          </div>
        </label>

        <div className="grid gap-2">
          <span className="text-[13px] text-[#6E625C]">{t("meSettings.mood")}</span>
          <div className="flex gap-2.5">
            {MOODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMood(m)}
                className="grid h-11 flex-1 place-items-center rounded-2xl border text-[20px] transition-colors"
                style={
                  mood === m
                    ? { background: "rgba(156,183,154,.5)", borderColor: "transparent" }
                    : { background: "rgba(255,255,255,.4)", borderColor: "var(--border)" }
                }
                aria-pressed={mood === m}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={() => void onSave()}
        disabled={saving}
        data-el="me-pregnancy-save"
        className="mt-5 flex w-full items-center justify-center rounded-full py-3.5 text-[15px] font-semibold text-white transition-opacity disabled:opacity-60"
        style={{ background: "linear-gradient(90deg,#AEC2CE,#9CB79A)", boxShadow: "0 10px 30px rgba(174,194,206,.4)" }}
      >
        {saving ? t("common.saving") : t("common.save")}
      </button>
    </ScreenShell>
  );
}
