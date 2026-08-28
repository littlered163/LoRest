"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Leaf, Bluetooth, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useEazo } from "@eazo/sdk/react";
import { ScreenShell } from "@/components/lorest/screen-shell";
import { LorestLangToggle } from "@/components/lorest/lorest-lang-toggle";
import { TOTAL_WEEKS, DEFAULT_DUE_DATE } from "@/lib/lorest/sleep";
import { saveProfile, addDeviceApi } from "@/lib/api";

const MOODS = ["😊", "😌", "🥱", "😣", "🤗"];
const TOTAL_STEPS = 2;

const PRIMARY_BTN =
  "flex w-full items-center justify-center rounded-full py-3.5 text-[15px] font-semibold text-white transition-opacity disabled:opacity-60";
const PRIMARY_STYLE = {
  background: "linear-gradient(90deg,#AEC2CE,#9CB79A)",
  boxShadow: "0 10px 30px rgba(174,194,206,.4)",
} as const;

export function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useEazo((s) => s.auth.user);
  const loading = useEazo((s) => s.auth.loading);

  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);

  const [week, setWeek] = useState(24);
  const [dueDate, setDueDate] = useState(DEFAULT_DUE_DATE);
  const [weightKg, setWeightKg] = useState("");
  const [mood, setMood] = useState<string | null>(null);

  const [scanning, setScanning] = useState(false);
  const [connectedName, setConnectedName] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  async function saveStep1() {
    setBusy(true);
    try {
      await saveProfile({
        week,
        dueDate,
        weightKg: weightKg === "" ? undefined : weightKg,
        mood: mood ?? undefined,
      });
      setStep(2);
    } catch {
      toast.error(t("common.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function scanBluetooth() {
    const bt = (navigator as Navigator & {
      bluetooth?: { requestDevice: (o: unknown) => Promise<{ name?: string }> };
    }).bluetooth;
    if (!bt) {
      toast.error(t("onboarding.unsupported"));
      return;
    }
    setScanning(true);
    try {
      const device = await bt.requestDevice({ acceptAllDevices: true });
      const name = device.name || "LoRest Z1";
      setConnectedName(name);
      await addDeviceApi({ name: "LoRest Z1", model: "Z1", bluetoothName: name });
      toast.success(t("onboarding.connected", { name }));
    } catch {
      toast.error(t("onboarding.failed"));
    } finally {
      setScanning(false);
    }
  }

  async function finish() {
    setBusy(true);
    try {
      await saveProfile({ onboarded: true });
      router.replace("/");
    } catch {
      toast.error(t("common.saveFailed"));
      setBusy(false);
    }
  }

  return (
    <ScreenShell withNav={false} label="荷眠引导">
      <div className="flex min-h-[calc(100svh-var(--safe-top)-var(--safe-bottom))] flex-col">
        <div className="flex items-center justify-between pt-2">
          <span className="text-[12px] text-muted-foreground">
            {t("onboarding.step", { n: step, total: TOTAL_STEPS })}
          </span>
          <LorestLangToggle />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <span
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full"
            style={{ background: "radial-gradient(circle,#fff,#9CB79A 65%)", boxShadow: "0 0 24px rgba(156,183,154,.5)" }}
            aria-hidden
          >
            {step === 1 ? <Leaf className="h-5 w-5 text-white/90" /> : <Bluetooth className="h-5 w-5 text-white/90" />}
          </span>
          <div>
            <h1 className="font-heading text-[24px] font-semibold leading-tight text-[#5F554F]">
              {t(step === 1 ? "onboarding.profileTitle" : "onboarding.deviceTitle")}
            </h1>
            <p className="mt-1 text-[13px] leading-[1.6] text-[#776C66]">
              {t(step === 1 ? "onboarding.profileSubtitle" : "onboarding.deviceSubtitle")}
            </p>
          </div>
        </div>

        <div className="mt-6 flex-1">
          {step === 1 ? (
            <section className="lorest-card lorest-card-strong grid gap-5 p-[18px]">
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
          ) : (
            <section className="lorest-card lorest-card-strong grid gap-4 p-[18px]">
              <button
                type="button"
                onClick={() => void scanBluetooth()}
                disabled={scanning}
                className="flex items-center justify-center gap-2 rounded-2xl border border-[#AEC2CE] bg-white/60 py-4 text-[15px] font-semibold text-[#5F7C6A] transition-opacity disabled:opacity-60"
              >
                <Bluetooth className="h-5 w-5" />
                {scanning ? t("onboarding.scanning") : t("onboarding.scan")}
              </button>
              {connectedName && (
                <div className="flex items-center gap-2 rounded-2xl bg-[rgba(156,183,154,.25)] px-4 py-3 text-[14px] text-[#4E6B52]">
                  <Check className="h-4 w-4" />
                  {t("onboarding.connected", { name: connectedName })}
                </div>
              )}
            </section>
          )}
        </div>

        <div className="grid gap-3 pb-8 pt-4">
          {step === 1 ? (
            <button type="button" onClick={() => void saveStep1()} disabled={busy} className={PRIMARY_BTN} style={PRIMARY_STYLE}>
              {busy ? t("common.saving") : t("onboarding.next")}
            </button>
          ) : (
            <>
              <button type="button" onClick={() => void finish()} disabled={busy} className={PRIMARY_BTN} style={PRIMARY_STYLE}>
                {busy ? t("onboarding.finishing") : t("onboarding.finish")}
              </button>
              {!connectedName && (
                <button
                  type="button"
                  onClick={() => void finish()}
                  disabled={busy}
                  className="py-1 text-center text-[13px] text-muted-foreground disabled:opacity-60"
                >
                  {t("onboarding.skip")}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </ScreenShell>
  );
}
