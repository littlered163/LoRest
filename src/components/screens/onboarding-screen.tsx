"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Leaf, Bluetooth, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/local-auth";
import { ScreenShell } from "@/components/lorest/screen-shell";
import { LorestLangToggle } from "@/components/lorest/lorest-lang-toggle";
import { weekFromLMP, dueDateFromLMP } from "@/lib/lorest/sleep";
import { saveProfile, addDeviceApi } from "@/lib/api";

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
  const { user, loading } = useAuth();

  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);

  const [pregnancyStartDate, setPregnancyStartDate] = useState("");
  const [initialWeightKg, setInitialWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");

  const [scanning, setScanning] = useState(false);
  const [connectedName, setConnectedName] = useState<string | null>(null);

  const lmpValid = /^\d{4}-\d{2}-\d{2}$/.test(pregnancyStartDate);
  const derivedWeek = lmpValid ? weekFromLMP(pregnancyStartDate) : null;
  const derivedDue = lmpValid ? dueDateFromLMP(pregnancyStartDate) : null;

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  async function saveStep1() {
    setBusy(true);
    try {
      const patch: Record<string, string> = {};
      if (pregnancyStartDate.trim()) patch.pregnancyStartDate = pregnancyStartDate.trim();
      if (initialWeightKg.trim()) patch.initialWeightKg = initialWeightKg.trim();
      if (heightCm.trim()) patch.heightCm = heightCm.trim();
      await saveProfile(patch);
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
                <span className="text-[13px] text-[#6E625C]">{t("meSettings.pregnancyStartDate")}</span>
                <input
                  type="date"
                  value={pregnancyStartDate}
                  onChange={(e) => setPregnancyStartDate(e.target.value)}
                  className="rounded-2xl border border-border bg-white/60 px-4 py-3 text-[15px] outline-none focus:border-[#AEC2CE]"
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
                  />
                  <span className="text-[13px] text-muted-foreground">cm</span>
                </div>
              </label>
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
