"use client";

import { cloneDefaultHouseholdKindDefinitions } from "@/lib/household-kind-defaults";
import { cloneDefaultCatalog } from "@/lib/product-catalog-defaults";
import type {
  AppSettings,
  AuthUser,
  Household,
  HouseholdKindDefinition,
  InventoryLedgerRow,
  ProductCatalog,
  PurchaseBatchLot,
  PurchaseRecord,
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
const K_PURCHASES = "him-purchases";
const K_INVENTORY_LEDGER = "him-inventory-ledger";

function isLedgerTypeString(x: string): x is InventoryLedgerRow["type"] {
  return x === "in" || x === "out" || x === "adjust" || x === "waste";
}

function isInventoryLedgerRowShape(x: unknown): x is InventoryLedgerRow {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.householdId === "string" &&
    typeof o.inventoryItemId === "string" &&
    typeof o.type === "string" &&
    isLedgerTypeString(o.type) &&
    typeof o.quantityDelta === "number" &&
    Number.isFinite(o.quantityDelta) &&
    typeof o.quantityAfter === "number" &&
    Number.isFinite(o.quantityAfter) &&
    typeof o.createdAt === "string"
  );
}

function isPurchaseBatchLotShape(x: unknown): x is PurchaseBatchLot {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.quantity === "number" &&
    Number.isFinite(o.quantity) &&
    o.quantity > 0 &&
    typeof o.expiresOn === "string" &&
    o.expiresOn.length >= 8
  );
}

function isPurchaseRecordShape(x: unknown): x is PurchaseRecord {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (
    typeof o.id !== "string" ||
    typeof o.householdId !== "string" ||
    typeof o.itemName !== "string" ||
    typeof o.purchasedOn !== "string" ||
    typeof o.unitPrice !== "number" ||
    !Number.isFinite(o.unitPrice) ||
    typeof o.totalPrice !== "number" ||
    !Number.isFinite(o.totalPrice) ||
    typeof o.unitSymbol !== "string" ||
    !Array.isArray(o.batches) ||
    o.batches.length === 0
  ) {
    return false;
  }
  return o.batches.every(isPurchaseBatchLotShape);
}

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
  const rest = { ...h };
  delete (rest as { catalog?: unknown }).catalog;
  return rest as Household;
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

const householdListeners = new Set<() => void>();

export function subscribeHouseholds(onStoreChange: () => void) {
  householdListeners.add(onStoreChange);
  return () => householdListeners.delete(onStoreChange);
}

function emitHouseholds() {
  householdListeners.forEach((fn) => fn());
}

export function setHouseholds(list: Household[]) {
  if (typeof window === "undefined") return;
  const stripped = list.map((h) => householdWithoutLegacyCatalog(h));
  localStorage.setItem(K_HOUSEHOLDS, JSON.stringify(stripped));
  emitHouseholds();
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

let purchasesCache: {
  raw: string | null | undefined;
  list: PurchaseRecord[];
} = { raw: undefined, list: [] };

const purchaseListeners = new Set<() => void>();

export function subscribePurchases(onStoreChange: () => void) {
  purchaseListeners.add(onStoreChange);
  return () => purchaseListeners.delete(onStoreChange);
}

function emitPurchases() {
  purchaseListeners.forEach((fn) => fn());
}

/** 구매·유통기한 로트 화면용 (거점별 `householdId` 필터는 UI에서 처리) */
export function getPurchases(): PurchaseRecord[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(K_PURCHASES);
  if (purchasesCache.raw === raw) return purchasesCache.list;
  const parsed = safeParse<unknown[]>(raw, []);
  const list = Array.isArray(parsed)
    ? parsed.filter(isPurchaseRecordShape)
    : [];
  purchasesCache = { raw, list };
  return list;
}

export function setPurchases(list: PurchaseRecord[]) {
  if (typeof window === "undefined") return;
  const str = JSON.stringify(list);
  localStorage.setItem(K_PURCHASES, str);
  purchasesCache = { raw: str, list };
  emitPurchases();
}

let ledgerCache: {
  raw: string | null | undefined;
  list: InventoryLedgerRow[];
} = { raw: undefined, list: [] };

const inventoryLedgerListeners = new Set<() => void>();

export function subscribeInventoryLedger(onStoreChange: () => void) {
  inventoryLedgerListeners.add(onStoreChange);
  return () => inventoryLedgerListeners.delete(onStoreChange);
}

function emitInventoryLedger() {
  inventoryLedgerListeners.forEach((fn) => fn());
}

/** 재고 소비·폐기 등 이력 (`him-inventory-ledger`) */
export function getInventoryLedger(): InventoryLedgerRow[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(K_INVENTORY_LEDGER);
  if (ledgerCache.raw === raw) return ledgerCache.list;
  const parsed = safeParse<unknown[]>(raw, []);
  const list = Array.isArray(parsed)
    ? parsed.filter(isInventoryLedgerRowShape)
    : [];
  ledgerCache = { raw, list };
  return list;
}

export function setInventoryLedger(list: InventoryLedgerRow[]) {
  if (typeof window === "undefined") return;
  const str = JSON.stringify(list);
  localStorage.setItem(K_INVENTORY_LEDGER, str);
  ledgerCache = { raw: str, list };
  emitInventoryLedger();
}

export function appendInventoryLedgerRow(row: InventoryLedgerRow) {
  setInventoryLedger([...getInventoryLedger(), row]);
}

/** 재고 이력 화면용 — 거점·구매·이력 중 하나라도 바뀌면 알림 */
export function subscribeInventoryHistoryBundle(onStoreChange: () => void) {
  const u1 = subscribeInventoryLedger(onStoreChange);
  const u2 = subscribePurchases(onStoreChange);
  const u3 = subscribeHouseholds(onStoreChange);
  return () => {
    u1();
    u2();
    u3();
  };
}

let historyBundleCache: {
  key: string;
  data: {
    ledger: InventoryLedgerRow[];
    households: Household[];
    purchases: PurchaseRecord[];
  };
} | null = null;

export function getInventoryHistoryBundleSnapshot(): {
  ledger: InventoryLedgerRow[];
  households: Household[];
  purchases: PurchaseRecord[];
} {
  if (typeof window === "undefined") {
    return { ledger: [], households: [], purchases: [] };
  }
  const ledger = getInventoryLedger();
  const households = getHouseholds();
  const purchases = getPurchases();
  const key = `${JSON.stringify(ledger)}|${JSON.stringify(households)}|${JSON.stringify(purchases)}`;
  if (historyBundleCache?.key === key) return historyBundleCache.data;
  const data = { ledger, households, purchases };
  historyBundleCache = { key, data };
  return data;
}

export { DEFAULTS as DEFAULT_APP_SETTINGS };
