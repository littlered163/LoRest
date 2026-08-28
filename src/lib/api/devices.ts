import { request } from "./request";

export interface DeviceDto {
  id: string;
  name: string;
  model: string;
  bluetoothName: string | null;
  online: boolean;
  lastSyncAt: string;
}

export async function fetchDevices(): Promise<DeviceDto[]> {
  const res = await request("/api/devices");
  if (!res.ok) throw new Error("failed to load devices");
  const data = (await res.json()) as { devices: DeviceDto[] };
  return data.devices;
}

export async function addDeviceApi(input: {
  name: string;
  model?: string;
  bluetoothName?: string | null;
}): Promise<DeviceDto> {
  const res = await request("/api/devices", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("failed to add device");
  const data = (await res.json()) as { device: DeviceDto };
  return data.device;
}

/** Refresh lastSyncAt for an online device (auto-sync when app opens). */
export async function syncDeviceApi(id: string): Promise<DeviceDto> {
  const res = await request("/api/devices", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error("failed to sync device");
  const data = (await res.json()) as { device: DeviceDto };
  return data.device;
}

export async function removeDeviceApi(id: string): Promise<void> {
  const res = await request("/api/devices", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error("failed to remove device");
}
