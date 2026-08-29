"use client";

import { useEffect, useRef, useState } from "react";
import { SOUND_ASSETS, type SoundKey } from "./sleep";

/**
 * Plays the real ambient recordings behind the companion sound buttons.
 * One sound at a time; toggling pauses the active one. Instances live in a
 * ref Map so a second tap resumes instantly without re-downloading.
 */
export function useSoundPlayer() {
  const [active, setActive] = useState<SoundKey | null>(null);
  const players = useRef(new Map<SoundKey, HTMLAudioElement>());
  const activeRef = useRef<SoundKey | null>(null);

  function ensure(key: SoundKey): HTMLAudioElement {
    let el = players.current.get(key);
    if (!el) {
      el = new Audio(SOUND_ASSETS[key]);
      el.loop = true;
      el.preload = "auto";
      players.current.set(key, el);
    }
    return el;
  }

  function toggle(key: SoundKey) {
    if (activeRef.current === key) {
      const el = ensure(key);
      el.pause();
      el.currentTime = 0;
      activeRef.current = null;
      setActive(null);
      return;
    }
    // Stop any other playing sound first.
    for (const [k, el] of players.current) {
      if (k !== key) {
        el.pause();
        el.currentTime = 0;
      }
    }
    const el = ensure(key);
    void el.play().catch(() => undefined);
    activeRef.current = key;
    setActive(key);
  }

  function stopAll() {
    for (const el of players.current.values()) {
      el.pause();
      el.currentTime = 0;
    }
    activeRef.current = null;
    setActive(null);
  }

  // Stop everything when the page unmounts.
  useEffect(() => {
    const ref = players.current;
    return () => {
      for (const el of ref.values()) {
        el.pause();
        el.currentTime = 0;
      }
      ref.clear();
    };
  }, []);

  return { active, toggle, stopAll };
}
