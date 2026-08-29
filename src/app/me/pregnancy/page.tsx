"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CalendarCheck, Check, Circle, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth/local-auth";
import { ScreenShell } from "@/components/lorest/screen-shell";
import { MeSubHeader } from "@/components/lorest/me-sub-header";
import { TOTAL_WEEKS, DEFAULT_DUE_DATE } from "@/lib/lorest/sleep";
import { fetchProfile, saveProfile, fetchCheckups, addCheckupApi, deleteCheckupApi } from "@/lib/api";
import type { CheckupDto } from "@/lib/api";

const MOODS = ["😊", "😌", "🥱", "😣", "🤗"];

export default function PregnancySettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [week, setWeek] = useState(24);
  const [dueDate, setDueDate] = useState(DEFAULT_DUE_DATE);
  const [weightKg, setWeightKg] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [checkups, setCheckups] = useState<CheckupDto[]>([]);
  const [newCheckup, setNewCheckup] = useState("");
  const [newCheckupDate, setNewCheckupDate] = useState("");

  useEffect(() => {
    if (!user) return;
    let active = true;
    Promise.all([fetchProfile(), fetchCheckups()])
      .then(([p, ck]) => {
        if (!active) return;
        setWeek(p.week);
        setDueDate(p.dueDate);
        setWeightKg(p.weightKg ?? "");
        setMood(p.mood);
        setCheckups(ck);
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

  async function onAddCheckup() {
    if (!newCheckup.trim() || !user) return;
    try {
      const checkup = await addCheckupApi(newCheckup.trim(), newCheckupDate.trim());
      setCheckups((prev) => [...prev, checkup]);
      setNewCheckup("");
      setNewCheckupDate("");
      toast.success(t("common.saved"));
    } catch {
      toast.error(t("common.saveFailed"));
    }
  }

  async function onDeleteCheckup(id: string) {
    if (!user) return;
    try {
      await deleteCheckupApi(id);
      setCheckups((prev) => prev.filter((c) => c.id !== id));
    } catch {
      toast.error(t("common.saveFailed"));
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

      {/* 产检管理 */}
      <section className="lorest-card lorest-card-strong grid gap-3 p-[18px]" data-el="me-checkups-form">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-[#6E8390]" />
          <span className="font-heading text-[15px]">产检记录</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCheckup}
            onChange={(e) => setNewCheckup(e.target.value)}
            placeholder="添加产检项目"
            className="flex-1 rounded-xl border border-border bg-white/60 px-3 py-2 text-[14px]"
          />
          <input
            type="text"
            value={newCheckupDate}
            onChange={(e) => setNewCheckupDate(e.target.value)}
            placeholder="日期"
            className="w-20 rounded-xl border border-border bg-white/60 px-2 py-2 text-[14px]"
          />
          <button
            type="button"
            onClick={() => void onAddCheckup()}
            disabled={!newCheckup.trim()}
            className="shrink-0 rounded-xl bg-[#8FB287] px-3 py-2 text-[14px] font-semibold text-white disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="grid gap-2">
          {checkups.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-xl bg-[#F5F2EE] px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full" style={{ background: c.done ? "rgba(127,154,166,.22)" : "rgba(156,183,154,.34)" }}>
                  {c.done ? <Check className="h-3.5 w-3.5 text-[#6E8390]" /> : <Circle className="h-3 w-3 text-[#B89A90]" />}
                </span>
                <span className="text-[14px]">{c.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-muted-foreground">{c.dateLabel}</span>
                <button type="button" onClick={() => void onDeleteCheckup(c.id)} className="text-[#E0917F] hover:opacity-70">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
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
