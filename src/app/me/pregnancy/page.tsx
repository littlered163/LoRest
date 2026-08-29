"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/local-auth";
import { ScreenShell } from "@/components/lorest/screen-shell";
import { MeSubHeader } from "@/components/lorest/me-sub-header";
import { weekFromLMP, dueDateFromLMP } from "@/lib/lorest/sleep";
import { fetchProfile, saveProfile } from "@/lib/api";

export default function PregnancySettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [pregnancyStartDate, setPregnancyStartDate] = useState("");
  const [initialWeightKg, setInitialWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    fetchProfile()
      .then((p) => {
        if (!active) return;
        setPregnancyStartDate(p.pregnancyStartDate ?? "");
        setInitialWeightKg(p.initialWeightKg ?? "");
        setHeightCm(p.heightCm ?? "");
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [user]);

  const lmpValid = /^\d{4}-\d{2}-\d{2}$/.test(pregnancyStartDate);
  const derivedWeek = lmpValid ? weekFromLMP(pregnancyStartDate) : null;
  const derivedDue = lmpValid ? dueDateFromLMP(pregnancyStartDate) : null;

  async function onSave() {
    if (!user) {
      toast.error(t("meSettings.signInFirst"));
      return;
    }
    const patch: Record<string, string> = {};
    if (pregnancyStartDate.trim()) patch.pregnancyStartDate = pregnancyStartDate.trim();
    if (initialWeightKg.trim()) patch.initialWeightKg = initialWeightKg.trim();
    if (heightCm.trim()) patch.heightCm = heightCm.trim();

    setSaving(true);
    try {
      await saveProfile(patch);
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
          <span className="text-[13px] text-[#6E625C]">{t("meSettings.pregnancyStartDate")}</span>
          <input
            type="date"
            value={pregnancyStartDate}
            onChange={(e) => setPregnancyStartDate(e.target.value)}
            className="rounded-2xl border border-border bg-white/60 px-4 py-3 text-[15px] outline-none focus:border-[#AEC2CE]"
            data-el="me-pregnancy-lmp"
          />
        </label>

        <div className="grid gap-2 rounded-2xl p-4" style={{ background: "rgba(255,252,247,.6)" }}>
          <div className="flex items-center justify-between text-[14px]">
            <span className="text-[13px] text-[#6E625C]">{t("meSettings.week")}</span>
            <span className="font-heading text-[16px] text-[#8E6A5E]">
              {derivedWeek !== null ? t("meSettings.weekValue", { week: derivedWeek }) : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between text-[14px]">
            <span className="text-[13px] text-[#6E625C]">{t("meSettings.dueDate")}</span>
            <span className="font-heading text-[16px] text-[#8E6A5E]">{derivedDue ?? "—"}</span>
          </div>
        </div>

        <label className="grid gap-2">
          <span className="text-[13px] text-[#6E625C]">{t("meSettings.initialWeight")}</span>
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-white/60 px-4 py-3">
            <input
              type="number"
              inputMode="decimal"
              value={initialWeightKg}
              onChange={(e) => setInitialWeightKg(e.target.value)}
              placeholder="—"
              className="w-full bg-transparent text-[15px] outline-none"
            />
            <span className="text-[13px] text-muted-foreground">kg</span>
          </div>
        </label>

        <label className="grid gap-2">
          <span className="text-[13px] text-[#6E625C]">{t("meSettings.height")}</span>
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-white/60 px-4 py-3">
            <input
              type="number"
              inputMode="decimal"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder="—"
              className="w-full bg-transparent text-[15px] outline-none"
              data-el="me-pregnancy-height"
            />
            <span className="text-[13px] text-muted-foreground">cm</span>
          </div>
        </label>
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
