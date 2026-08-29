"use client";

import { useCallback, useEffect, useRef } from "react";
import { VOICE_ASSETS, type BreathLineKey } from "./sleep";

/**
 * Voiced guidance for the breathing exercise, played from prerecorded
 * gentle-neural audio (Xiaoxiao 晓晓 / Jenny) rather than speechSynthesis.
 * Real files behave identically in every environment — including WeChat's
 * in-app browser, where the Web Speech API is unreliable or silent.
 *
 * Instances live in a ref Map so cues are instant on repeat plays.
 */
export function useBreathVoice(lang: string) {
  const zh = lang.startsWith("zh");
  const lines = useRef(new Map<BreathLineKey, HTMLAudioElement>());

  function ensure(key: BreathLineKey): HTMLAudioElement {
    let el = lines.current.get(key);
    if (!el) {
      el = new Audio(VOICE_ASSETS[zh ? "zh" : "en"][key]);
      el.preload = "auto";
      lines.current.set(key, el);
    }
    return el;
  }

  // Warm up all five lines so the first tap never waits on the network.
  useEffect(() => {
    const map = VOICE_ASSETS[zh ? "zh" : "en"];
    (Object.keys(map) as BreathLineKey[]).forEach((key) => ensure(key).load());
    // ensure() captures `zh`; recreate on language switch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zh]);

  /** Play one guidance line, cutting off anything currently speaking. When
   * `onEnd` is given it fires once the line finishes — used to chain the phase
   * cues after the warm intro so it is never cut short. */
  const play = useCallback(
    (key: BreathLineKey, onEnd?: () => void) => {
      const el = ensure(key);
      // Only one line speaks at a time.
      for (const other of lines.current.values()) {
        if (other !== el) {
          other.pause();
          other.currentTime = 0;
          other.onended = null;
        }
      }
      el.onended = () => onEnd?.();
      el.currentTime = 0;
      void el.play().catch(() => undefined);
    },
    // ensure() captures `zh`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [zh],
  );

  const stop = useCallback(() => {
    for (const el of lines.current.values()) {
      el.pause();
      el.currentTime = 0;
      el.onended = null;
    }
  }, []);

  // Silence the voice when leaving the page.
  useEffect(() => {
    const ref = lines.current;
    return () => {
      for (const el of ref.values()) {
        el.pause();
        el.onended = null;
      }
    };
  }, []);

  return { play, stop };
}
