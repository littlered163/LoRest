"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ShieldCheck, Download, Trash2, Database } from "lucide-react";
import { toast } from "sonner";
import { ScreenShell } from "@/components/lorest/screen-shell";
import { MeSubHeader } from "@/components/lorest/me-sub-header";

export default function PrivacyPage() {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);

  const points = ["point1", "point2", "point3"] as const;

  return (
    <ScreenShell label="隐私与数据">
      <MeSubHeader title={t("privacy.title")} />

      <section className="lorest-card lorest-card-strong p-[18px]" data-el="privacy-intro">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[#6E8390]" aria-hidden />
          <h2 className="font-heading text-[17px]">{t("privacy.introTitle")}</h2>
        </div>
        <div className="mt-3 grid gap-2.5">
          {points.map((k) => (
            <div key={k} className="flex gap-2 text-[13px] leading-[1.6] text-[#776C66]">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "#AEC2CE" }} aria-hidden />
              {t(`privacy.${k}`)}
            </div>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={() => toast.success(t("privacy.exportDone"))}
        className="lorest-card mt-4 flex w-full items-center gap-3 p-4 text-left"
        data-el="privacy-export"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full" style={{ background: "rgba(174,194,206,.28)" }}>
          <Download className="h-5 w-5 text-[#6E8390]" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] text-[#5F554F]">{t("privacy.export")}</div>
          <div className="mt-0.5 text-[12px] text-muted-foreground">{t("privacy.exportSub")}</div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => {
          if (!confirming) {
            setConfirming(true);
            return;
          }
          setConfirming(false);
          toast.success(t("privacy.clearDone"));
        }}
        className="lorest-card mt-3 flex w-full items-center gap-3 p-4 text-left"
        data-el="privacy-clear"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full" style={{ background: "rgba(201,133,123,.18)" }}>
          <Trash2 className="h-5 w-5 text-[#C0857B]" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] text-[#C0857B]">{confirming ? t("privacy.clearConfirm") : t("privacy.clear")}</div>
          <div className="mt-0.5 text-[12px] text-muted-foreground">{t("privacy.clearSub")}</div>
        </div>
      </button>

      <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[12px] text-muted-foreground">
        <Database className="h-3.5 w-3.5" aria-hidden />
        {t("privacy.storedNote")}
      </p>
    </ScreenShell>
  );
}
