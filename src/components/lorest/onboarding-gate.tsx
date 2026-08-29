"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/local-auth";
import { fetchProfile } from "@/lib/api";

export function OnboardingGate() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const checkedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (pathname.startsWith("/onboarding") || pathname.startsWith("/login")) return;

    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.id.startsWith("roadshow-demo-")) return;

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
