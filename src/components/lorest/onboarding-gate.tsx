"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useEazo } from "@eazo/sdk/react";
import { fetchProfile } from "@/lib/api";

/**
 * After login, ensures new users complete onboarding (pregnancy profile +
 * device pairing) before reaching the main app. A user who has never set
 * `onboarded` is redirected to /onboarding. Runs once per signed-in user.
 * Skipped on /login and /onboarding themselves.
 */
export function OnboardingGate() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useEazo((s) => s.auth.user);
  const loading = useEazo((s) => s.auth.loading);
  const checkedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    if (pathname.startsWith("/onboarding") || pathname.startsWith("/login")) return;
    if (checkedUserId.current === user.id) return;
    checkedUserId.current = user.id;

    let active = true;
    fetchProfile()
      .then((p) => {
        if (active && !p.onboarded) router.replace("/onboarding");
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [user, loading, pathname, router]);

  return null;
}
