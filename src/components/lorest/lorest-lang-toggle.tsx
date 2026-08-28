"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  changeLocale,
  getLocalePreference,
  normalizeLocale,
  type LocaleCode,
  type LocalePreference,
} from "@/i18n";

/** App-styled locale toggle matching LoRest's soft warm-aura chrome. */
export function LorestLangToggle() {
  const { t, i18n } = useTranslation();

  const subscribe = useCallback(
    (sync: () => void) => {
      i18n.on("languageChanged", sync);
      window.addEventListener("eazo-locale-preference-changed", sync);
      window.addEventListener("storage", sync);
      return () => {
        i18n.off("languageChanged", sync);
        window.removeEventListener("eazo-locale-preference-changed", sync);
        window.removeEventListener("storage", sync);
      };
    },
    [i18n],
  );

  const preference = useSyncExternalStore(
    subscribe,
    getLocalePreference,
    () => "system" as LocalePreference,
  );

  const active = normalizeLocale(i18n.resolvedLanguage || i18n.language) ?? "en-US";

  function toggle() {
    const next: LocaleCode = active === "zh-CN" ? "en-US" : "zh-CN";
    void changeLocale(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      data-el="lang-toggle"
      className="flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs text-[#7D726D] shadow-sm"
      style={{ background: "rgba(255,255,255,.4)", backdropFilter: "blur(16px)" }}
      title={t("language.label")}
      aria-label={t("language.label")}
    >
      <Languages className="h-3.5 w-3.5" aria-hidden />
      <span>{active === "zh-CN" ? "中文" : "EN"}</span>
      <span className="text-[10px]" aria-hidden>{preference === "system" ? "·系统" : ""}</span>
    </button>
  );
}
