"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth/local-auth";
import { fetchDevices, syncDeviceApi, type DeviceDto } from "@/lib/api";

function demoDevice(): DeviceDto {
  return {
    id: "roadshow-demo-mattress",
    name: "荷眠智能床垫",
    model: "LoRest Z1",
    bluetoothName: "LoRest-Z1-Anan",
    online: true,
    lastSyncAt: new Date().toISOString(),
  };
}

/**
 * Loads the signed-in user's paired devices. If the primary device is online,
 * it triggers a one-shot auto-sync (refreshes lastSyncAt) to mirror the "app
 * opened → mattress syncs" behavior, and surfaces a transient `syncing` flag.
 */
export function useDevices() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<DeviceDto[] | null>(null);
  const [syncing, setSyncing] = useState(false);
  const syncedFor = useRef<string | null>(null);

  const load = useCallback(() => {
    if (!user) {
      setDevices(null);
      return;
    }
    fetchDevices()
      .then(async (list) => {
        if (user.id.startsWith("roadshow-demo-") && list.length === 0) {
          list = [demoDevice()];
        }
        setDevices(list);
        const primary = list[0];
        if (primary?.online && syncedFor.current !== primary.id) {
          syncedFor.current = primary.id;
          setSyncing(true);
          try {
            const updated = await syncDeviceApi(primary.id);
            setDevices((prev) => (prev ? prev.map((d) => (d.id === updated.id ? updated : d)) : prev));
          } catch {
            /* ignore */
          } finally {
            setTimeout(() => setSyncing(false), 900);
          }
        }
      })
      .catch(() => setDevices(user.id.startsWith("roadshow-demo-") ? [demoDevice()] : []));
  }, [user]);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return { devices, primary: devices?.[0] ?? null, syncing, loaded: devices !== null, reload: load };
}

/** Localized relative time for a device's last sync. `t` from useTranslation. */
export function formatLastSync(iso: string, t: (k: string, o?: Record<string, unknown>) => string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return t("device.justNow");
  if (min < 60) return t("device.minutesAgo", { n: min });
  return t("device.hoursAgo", { n: Math.floor(min / 60) });
}
