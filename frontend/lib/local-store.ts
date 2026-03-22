"use client";

import { cloneDefaultHouseholdKindDefinitions } from "@/lib/household-kind-defaults";
import { cloneDefaultCatalog } from "@/lib/product-catalog-defaults";
import type {
  AppSettings,
  AuthUser,
  Household,
  HouseholdKindDefinition,
  ProductCatalog,
} from "@/types/domain";
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
/** `/mock/settings` 계정·보안 UI 전용 목 프로필(API·him-user와 분리) */
const K_MOCK_SETTINGS_ACCOUNT = "him-mock-settings-account";
const K_HOUSEHOLDS = "him-households";
const K_CATALOG = "him-product-catalog";
const K_HOUSEHOLD_KINDS = "him-household-kinds";
const K_SETTINGS = "him-settings";

function isHouseholdKindDefinitionsShape(
  x: unknown,
): x is HouseholdKindDefinition[] {
  if (!Array.isArray(x)) return false;
  return x.every(
    (row) =>
      row != null &&
      typeof row === "object" &&
      typeof (row as HouseholdKindDefinition).id === "string" &&
      typeof (row as HouseholdKindDefinition).label === "string",
  );
}

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

/** 거점 유형 라벨 목록 (대시보드·설정 공통, `him-household-kinds`) */
export function getSharedHouseholdKindDefinitions(): HouseholdKindDefinition[] {
  if (typeof window === "undefined") {
    return cloneDefaultHouseholdKindDefinitions();
  }
  const raw = localStorage.getItem(K_HOUSEHOLD_KINDS);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (isHouseholdKindDefinitionsShape(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      /* fallthrough */
    }
  }
  const d = cloneDefaultHouseholdKindDefinitions();
  localStorage.setItem(K_HOUSEHOLD_KINDS, JSON.stringify(d));
  return d;
}

export function setSharedHouseholdKindDefinitions(
  defs: HouseholdKindDefinition[],
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(K_HOUSEHOLD_KINDS, JSON.stringify(defs));
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

/** `/mock` 설정 화면에 기본으로 채워 넣는 목 계정(참조 동일성 유지) */
export const MOCK_SETTINGS_ACCOUNT_SEED: AuthUser = Object.freeze({
  email: "kim.demo@household.mock",
  displayName: "김데모",
  emailVerified: false,
});

function normalizeMockSettingsAccountUser(
  parsed: Partial<AuthUser> | null,
): AuthUser {
  if (!parsed || typeof parsed !== "object") {
    return { ...MOCK_SETTINGS_ACCOUNT_SEED };
  }
  const email =
    typeof parsed.email === "string" && parsed.email.trim()
      ? parsed.email.trim()
      : MOCK_SETTINGS_ACCOUNT_SEED.email;
  const displayName =
    typeof parsed.displayName === "string" && parsed.displayName.trim()
      ? parsed.displayName.trim()
      : MOCK_SETTINGS_ACCOUNT_SEED.displayName;
  return {
    email,
    displayName,
    emailVerified: parsed.emailVerified === true,
  };
}

let mockSettingsAccountCache: {
  raw: string | null | undefined;
  user: AuthUser;
} = {
  raw: undefined,
  user: MOCK_SETTINGS_ACCOUNT_SEED,
};

const mockSettingsAccountListeners = new Set<() => void>();

export function subscribeMockSettingsAccountUser(onStoreChange: () => void) {
  mockSettingsAccountListeners.add(onStoreChange);
  return () => mockSettingsAccountListeners.delete(onStoreChange);
}

function emitMockSettingsAccountUser() {
  mockSettingsAccountListeners.forEach((fn) => fn());
}

/** 스냅샷은 항상 비-null (`localStorage` 비어 있으면 시드) */
export function getMockSettingsAccountUserSnapshot(): AuthUser {
  if (typeof window === "undefined") return MOCK_SETTINGS_ACCOUNT_SEED;
  const raw = localStorage.getItem(K_MOCK_SETTINGS_ACCOUNT);
  if (mockSettingsAccountCache.raw === raw) return mockSettingsAccountCache.user;
  if (!raw) {
    mockSettingsAccountCache = {
      raw: null,
      user: MOCK_SETTINGS_ACCOUNT_SEED,
    };
    return MOCK_SETTINGS_ACCOUNT_SEED;
  }
  const user = normalizeMockSettingsAccountUser(
    safeParse<Partial<AuthUser>>(raw, {}),
  );
  mockSettingsAccountCache = { raw, user };
  return user;
}

export function setMockSettingsAccountUser(user: AuthUser) {
  if (typeof window === "undefined") return;
  const normalized = normalizeMockSettingsAccountUser(user);
  localStorage.setItem(
    K_MOCK_SETTINGS_ACCOUNT,
    JSON.stringify(normalized),
  );
  const raw = localStorage.getItem(K_MOCK_SETTINGS_ACCOUNT);
  mockSettingsAccountCache = { raw, user: normalized };
  emitMockSettingsAccountUser();
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
