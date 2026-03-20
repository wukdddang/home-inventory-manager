"use client";

import { cloneDefaultCatalog } from "@/lib/product-catalog-defaults";
import type { AppSettings, AuthUser, Household, ProductCatalog } from "@/types/domain";
import {
  DEFAULT_NOTIFICATION_DETAIL,
  DEFAULT_SETTINGS as DEFAULTS,
} from "@/types/domain";

function normalizeAppSettings(partial: Partial<AppSettings>): AppSettings {
  return {
    ...DEFAULTS,
    ...partial,
    groups: partial.groups ?? DEFAULTS.groups,
    notificationDetail: {
      ...DEFAULT_NOTIFICATION_DETAIL,
      ...(partial.notificationDetail ?? {}),
    },
  };
}

const K_USER = "him-user";
const K_HOUSEHOLDS = "him-households";
const K_CATALOG = "him-product-catalog";
const K_SETTINGS = "him-settings";

function isProductCatalogShape(x: unknown): x is ProductCatalog {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    Array.isArray(o.categories) &&
    Array.isArray(o.products) &&
    Array.isArray(o.variants) &&
    Array.isArray(o.units)
  );
}

/** JSON에 남아 있을 수 있는 레거시 catalog 필드 제거 */
function householdWithoutLegacyCatalog(
  h: Household & { catalog?: unknown },
): Household {
  const { catalog: _, ...rest } = h;
  return rest;
}

/**
 * 전역 공통 상품 카탈로그 (거점과 분리 저장).
 * 키가 없으면 거점 JSON에 박힌 레거시 catalog를 한 번 옮긴 뒤 제거한다.
 */
export function getSharedProductCatalog(): ProductCatalog {
  if (typeof window === "undefined") return cloneDefaultCatalog();
  const rawCat = localStorage.getItem(K_CATALOG);
  if (rawCat) {
    try {
      const parsed = JSON.parse(rawCat) as unknown;
      if (isProductCatalogShape(parsed)) return parsed;
    } catch {
      /* fallthrough */
    }
  }
  const rawH = localStorage.getItem(K_HOUSEHOLDS);
  const households = safeParse<(Household & { catalog?: unknown })[]>(
    rawH,
    [],
  );
  for (const h of households) {
    if (h.catalog != null && isProductCatalogShape(h.catalog)) {
      const c = structuredClone(h.catalog);
      localStorage.setItem(K_CATALOG, JSON.stringify(c));
      const stripped = households.map(householdWithoutLegacyCatalog);
      localStorage.setItem(K_HOUSEHOLDS, JSON.stringify(stripped));
      return c;
    }
  }
  const d = cloneDefaultCatalog();
  localStorage.setItem(K_CATALOG, JSON.stringify(d));
  return d;
}

export function setSharedProductCatalog(catalog: ProductCatalog) {
  if (typeof window === "undefined") return;
  localStorage.setItem(K_CATALOG, JSON.stringify(catalog));
}

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
  const list = safeParse<(Household & { catalog?: unknown })[]>(
    localStorage.getItem(K_HOUSEHOLDS),
    [],
  );
  return list.map(householdWithoutLegacyCatalog);
}

export function setHouseholds(list: Household[]) {
  if (typeof window === "undefined") return;
  const stripped = list.map((h) => householdWithoutLegacyCatalog(h));
  localStorage.setItem(K_HOUSEHOLDS, JSON.stringify(stripped));
}

export function getAppSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULTS;
  const s = safeParse<Partial<AppSettings>>(
    localStorage.getItem(K_SETTINGS),
    {},
  );
  return normalizeAppSettings(s);
}

export function setAppSettings(s: AppSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(K_SETTINGS, JSON.stringify(s));
}

export { DEFAULTS as DEFAULT_APP_SETTINGS };
