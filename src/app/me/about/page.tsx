"use client";

import { useTranslation } from "react-i18next";
import { BedDouble, Cpu, Bluetooth, FileText, Shield } from "lucide-react";
import { ScreenShell } from "@/components/lorest/screen-shell";
import { MeSubHeader } from "@/components/lorest/me-sub-header";
import { DEVICE } from "@/lib/lorest/sleep";

const APP_VERSION = "1.0.0";

export default function AboutPage() {
  const { t } = useTranslation();

  const info = [
    { key: "version", Icon: FileText, value: APP_VERSION },
    { key: "device", Icon: BedDouble, value: DEVICE.name },
    { key: "firmware", Icon: Cpu, value: DEVICE.firmware },
    { key: "bluetooth", Icon: Bluetooth, value: DEVICE.bluetoothName },
  ] as const;

  const links = ["terms", "policy"] as const;

  return (
    <ScreenShell label="关于">
      <MeSubHeader title={t("about.title")} />

      <section className="lorest-card lorest-card-strong flex flex-col items-center p-[22px] text-center" data-el="about-brand">
        <span
          className="grid h-16 w-16 place-items-center rounded-full"
          style={{ background: "radial-gradient(circle,#fff,#9CB79A 62%,#E4CDA0)" }}
          aria-hidden
        >
          <BedDouble className="h-7 w-7 text-white/90" />
        </span>
        <div className="font-heading mt-3 text-[20px] font-semibold text-[#5F554F]">LoRest · 荷眠</div>
        <p className="mt-1.5 text-[13px] leading-[1.6] text-muted-foreground">{t("about.tagline")}</p>
      </section>

      <section className="lorest-card mt-4 overflow-hidden p-0" data-el="about-info">
        {info.map(({ key, Icon, value }, i) => (
          <div
            key={key}
            className="flex items-center gap-3 px-[18px] py-3.5"
            style={i > 0 ? { borderTop: "1px solid var(--border)" } : undefined}
          >
            <Icon className="h-4.5 w-4.5 text-[#9A8E86]" aria-hidden />
            <span className="flex-1 text-[14px] text-[#5F554F]">{t(`about.${key}`)}</span>
            <span className="text-[13px] text-muted-foreground">{value}</span>
          </div>
        ))}
      </section>

      <section className="lorest-card mt-4 overflow-hidden p-0" data-el="about-links">
        {links.map((key, i) => (
          <button
            key={key}
            type="button"
            className="flex w-full items-center gap-3 px-[18px] py-4 text-left"
            style={i > 0 ? { borderTop: "1px solid var(--border)" } : undefined}
          >
            <Shield className="h-4.5 w-4.5 text-[#9A8E86]" aria-hidden />
            <span className="flex-1 text-[15px] text-[#5F554F]">{t(`about.${key}`)}</span>
          </button>
        ))}
      </section>

      <p className="mt-5 text-center text-[12px] text-muted-foreground">{t("about.copyright")}</p>
    </ScreenShell>
  );
}
