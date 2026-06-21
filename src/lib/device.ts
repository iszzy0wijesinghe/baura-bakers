const DEVICE_ID_KEY = "baura_device_id_v1";

export function createClientUuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getBauraDeviceId() {
  if (typeof window === "undefined") {
    return createClientUuid();
  }

  const existing = window.localStorage.getItem(DEVICE_ID_KEY);

  if (existing && existing.trim().length >= 12) {
    return existing;
  }

  const next = createClientUuid();
  window.localStorage.setItem(DEVICE_ID_KEY, next);

  return next;
}

export function readBauraDeviceId() {
  if (typeof window === "undefined") return null;

  return window.localStorage.getItem(DEVICE_ID_KEY);
}