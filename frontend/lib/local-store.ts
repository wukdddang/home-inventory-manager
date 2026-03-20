"use client";

import type { AppSettings, AuthUser, Household } from "@/types/domain";
import { DEFAULT_SETTINGS as DEFAULTS } from "@/types/domain";

const K_USER = "him-user";
const K_HOUSEHOLDS = "him-households";
const K_SETTINGS = "him-settings";

/** useSyncExternalStore용 — 동일 raw면 동일 참조 유지 (불필요한 리렌더 방지) */
let authUserCache: { raw: string | null | undefined; user: AuthUser | null } = {
  raw: undefined,
  user: null,
};

const authUserListeners = new Set<() => void>();

export function subscribeAuthUser(onStoreChange: () => void) {
  authUserListeners.add(onStoreChange);
  return () => authUserListeners.delete(onStoreChange);
}

function emitAuthUser() {
  authUserListeners.forEach((fn) => fn());
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getAuthUserSnapshot(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(K_USER);
  if (authUserCache.raw === raw) return authUserCache.user;
  authUserCache = {
    raw,
    user: safeParse<AuthUser | null>(raw, null),
  };
  return authUserCache.user;
}

export function getAuthUser(): AuthUser | null {
  return getAuthUserSnapshot();
}

export function setAuthUser(user: AuthUser | null) {
  if (typeof window === "undefined") return;
  if (user) localStorage.setItem(K_USER, JSON.stringify(user));
  else localStorage.removeItem(K_USER);
  const raw = localStorage.getItem(K_USER);
  authUserCache = {
    raw,
    user: safeParse<AuthUser | null>(raw, null),
  };
  emitAuthUser();
}

export function getHouseholds(): Household[] {
  if (typeof window === "undefined") return [];
  return safeParse<Household[]>(localStorage.getItem(K_HOUSEHOLDS), []);
}

export function setHouseholds(list: Household[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(K_HOUSEHOLDS, JSON.stringify(list));
}

export function getAppSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULTS;
  const s = safeParse<Partial<AppSettings>>(
    localStorage.getItem(K_SETTINGS),
    {},
  );
  return { ...DEFAULTS, ...s, groups: s.groups ?? DEFAULTS.groups };
}

export function setAppSettings(s: AppSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(K_SETTINGS, JSON.stringify(s));
}

export { DEFAULTS as DEFAULT_APP_SETTINGS };
