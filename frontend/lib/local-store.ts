"use client";

import type { AppSettings, AuthUser, Household } from "@/types/domain";
import { DEFAULT_SETTINGS as DEFAULTS } from "@/types/domain";

const K_USER = "him-user";
const K_HOUSEHOLDS = "him-households";
const K_SETTINGS = "him-settings";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  return safeParse<AuthUser | null>(localStorage.getItem(K_USER), null);
}

export function setAuthUser(user: AuthUser | null) {
  if (typeof window === "undefined") return;
  if (user) localStorage.setItem(K_USER, JSON.stringify(user));
  else localStorage.removeItem(K_USER);
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
