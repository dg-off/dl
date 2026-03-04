export type JsonRecord = Record<string, unknown>;

const isObject = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null;

export const isSyncMessage = (
  value: unknown,
  allowedTypes: readonly string[]
): value is JsonRecord & { type: string; ts: number } => {
  if (!isObject(value)) return false;
  if (typeof value.type !== "string") return false;
  if (typeof value.ts !== "number") return false;
  return allowedTypes.includes(value.type);
};

export const createSyncMessage = <TType extends string, T extends JsonRecord>(
  type: TType,
  payload: T
): T & { type: TType; ts: number } => ({
  type,
  ts: Date.now(),
  ...payload,
});

export const loadJsonFromStorage = <T>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const saveJsonToStorage = <T>(key: string, value: T): void => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // No-op: local storage may be blocked.
  }
};
