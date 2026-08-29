"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Trees, CloudRain, Waves, Moon, Play, Square, Pause } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ScreenShell } from "@/components/lorest/screen-shell";
import { LorestLangToggle } from "@/components/lorest/lorest-lang-toggle";
import {
  BREATH_PHASES,
  BREATH_TOTAL_ROUNDS,
  SOUNDS,
  type SoundKey,
} from "@/lib/lorest/sleep";
import { useBreathVoice } from "@/lib/lorest/use-breath-voice";
import { useSoundPlayer } from "@/lib/lorest/use-sound-player";

const SOUND_ICONS: Record<SoundKey, typeof Trees> = {
  forest: Trees,
  rain: CloudRain,
  water: Waves,
  night: Moon,
};

type Phase = "inhale" | "hold" | "exhale";

export default function CompanionPage() {
  const { t, i18n } = useTranslation();
  const zh = (i18n.resolvedLanguage || i18n.language).startsWith("zh");

  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [round, setRound] = useState(1);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const { active: activeSound, toggle: toggleSound } = useSoundPlayer();
  const { play: playBreath, stop: stopBreathVoice } = useBreathVoice(zh ? "zh-CN" : "en-US");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The warm opening line plays first; phase cues wait until it ends so the
  // intro is never cut short. The intro already guides the first inhale, so
  // that first cue is naturally skipped.
  const introDone = useRef(false);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const stop = useCallback(() => {
    clear();
    setRunning(false);
    setRound(1);
    setPhaseIdx(0);
    stopBreathVoice();
  }, [clear, stopBreathVoice]);

  useEffect(() => {
    if (!running) return;
    const phase = BREATH_PHASES[phaseIdx];
    // Warm prerecorded cues; they wait for the intro to finish so the opening
    // line is never cut short (and it already guides the first inhale).
    if (introDone.current) {
      playBreath(phase.key);
    }
    timer.current = setTimeout(() => {
      if (phaseIdx < BREATH_PHASES.length - 1) {
        setPhaseIdx((p) => p + 1);
      } else if (round < BREATH_TOTAL_ROUNDS) {
        setRound((r) => r + 1);
        setPhaseIdx(0);
      } else {
        setRunning(false);
        setDone(true);
        setRound(1);
        setPhaseIdx(0);
        playBreath("done");
      }
    }, phase.seconds * 1000);
    return clear;
  }, [running, phaseIdx, round, clear, playBreath]);

  useEffect(() => () => clear(), [clear]);

  // Cut off the voice + any playing sound when leaving the page.
  useEffect(() => () => stopBreathVoice(), [stopBreathVoice]);

  const phase = BREATH_PHASES[phaseIdx];
  const phaseKey = phase.key as Phase;
  const scale = running ? (phaseKey === "inhale" ? 1.28 : phaseKey === "hold" ? 1.28 : 0.82) : 1;
  const centerLabel = done
    ? t("companion.breathDone")
    : running
      ? t(`companion.breath${phaseKey === "inhale" ? "Inhale" : phaseKey === "hold" ? "Hold" : "Exhale"}`)
      : t("companion.breathReady");

  function start() {
    introDone.current = false;
    setDone(false);
    setRound(1);
    setPhaseIdx(0);
    setRunning(true);
    // Warm opening line; phase cues wait for this to finish.
    playBreath("intro", () => {
      introDone.current = true;
    });
  }

  return (
    <ScreenShell label="睡前陪伴">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-[28px] font-semibold leading-tight">{t("companion.title")}</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">{t("companion.subtitle")}</p>
        </div>
        <LorestLangToggle />
      </header>

      <section className="lorest-card lorest-card-strong px-4 py-7" data-el="companion-breath">
        <h2 className="text-center font-heading text-[16px] text-[#6E625C]">{t("companion.breathTitle")}</h2>
        <div className="mt-5 grid place-items-center">
          <div className="relative grid h-[220px] w-[220px] place-items-center">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: "radial-gradient(circle at 45% 38%, rgba(255,255,255,.92), rgba(156,183,154,.5) 55%, rgba(228,205,160,.35))",
                boxShadow: "0 0 60px rgba(156,183,154,.55)",
                transform: `scale(${scale})`,
                transition: `transform ${phase.seconds}s var(--lorest-ease)`,
              }}
              aria-hidden
            />
            <div className="relative text-center">
              <div className="font-heading text-[20px] text-[#7A6156]">{centerLabel}</div>
              {running && (
                <div className="mt-1 text-[13px] text-[#9A8E86]">
                  {t("companion.breathRound", { round, total: BREATH_TOTAL_ROUNDS })}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-6 grid place-items-center">
          {running ? (
            <button
              type="button"
              onClick={stop}
              data-el="companion-breath-stop"
              className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-[#7A6156]"
              style={{ background: "rgba(255,255,255,.6)", border: "1px solid var(--border)" }}
            >
              <Square className="h-4 w-4" aria-hidden /> {t("companion.breathStop")}
            </button>
          ) : (
            <button
              type="button"
              onClick={start}
              data-el="companion-breath-start"
              className="flex items-center gap-2 rounded-full px-7 py-3 text-sm font-medium text-white"
              style={{ background: "linear-gradient(120deg,#9CB79A,#E4CDA0)", boxShadow: "0 12px 30px rgba(156,183,154,.5)" }}
            >
              <Play className="h-4 w-4" aria-hidden /> {t("companion.breathStart")}
            </button>
          )}
        </div>
      </section>

      <section className="lorest-card mt-4 p-[18px]" data-el="companion-sounds">
        <h2 className="font-heading text-[17px]">{t("companion.soundTitle")}</h2>
        <div className="mt-3 grid grid-cols-4 gap-2.5">
          {SOUNDS.map((key) => {
            const Icon = SOUND_ICONS[key];
            const on = activeSound === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleSound(key)}
                data-el="companion-sound-item"
                className="grid place-items-center gap-1.5 rounded-2xl px-2 py-3.5 transition-colors"
                style={on ? { background: "rgba(156,183,154,.45)" } : { background: "rgba(255,252,247,.5)" }}
                aria-pressed={on}
              >
                <span className="grid h-9 w-9 place-items-center rounded-full" style={{ background: on ? "rgba(255,255,255,.7)" : "rgba(174,194,206,.25)" }}>
                  {on ? <Pause className="h-4 w-4 text-[#8E6A5E]" /> : <Icon className="h-4 w-4 text-[#6E8390]" />}
                </span>
                <span className="text-[12px] text-[#6E625C]">{t(`companion.sound${key.charAt(0).toUpperCase()}${key.slice(1)}`)}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-center text-[12px] text-muted-foreground">
          {activeSound ? t("companion.soundPlaying") : t("companion.soundPaused")}
        </p>
      </section>

      <section className="lorest-card mt-4 p-[20px] text-center" data-el="companion-quote">
        <div className="text-[12px] tracking-wide text-muted-foreground">{t("companion.quoteTitle")}</div>
        <p className="font-heading mt-2 text-[17px] leading-[1.7] text-[#6E625C]">{t("companion.quote")}</p>
      </section>
    </ScreenShell>
  );
}
