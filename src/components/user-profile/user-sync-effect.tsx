"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth/local-auth";

export function UserSyncEffect() {
  const { authenticated, user, getSessionToken } = useAuth();
  const syncedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!authenticated || !user) return;
    if (syncedUserId.current === user.id) return;
    syncedUserId.current = user.id;

    const token = getSessionToken();
    if (!token) return;

    fetch("/api/user/profile", {
      headers: { "x-lorest-session": token },
    }).catch((err) => {
      console.error("[UserSyncEffect] profile fetch failed", err);
    });
  }, [authenticated, user, getSessionToken]);

  return null;
}
