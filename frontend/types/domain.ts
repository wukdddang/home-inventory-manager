/**
 * 프론트 UI·로컬 저장용 타입 (백엔드 ERD: Household, StorageLocation, InventoryItem 정렬)
 */

/**
 * 거점 유형 정의 (라벨은 사용자가 설정·추가·삭제 가능, id는 안정 키).
 * 기본 id: home, office, vehicle, other
 */
export type HouseholdKindDefinition = {
  id: string;
  label: string;
  sortOrder?: number;
};

/** 2D 구조 방 — house-structure-feature.md 의 rooms[] 와 동일 개념 */
export type StructureRoom = {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

/** 논리 설계 §6 FurniturePlacement — 방 안 가구 인스턴스 */
export type FurniturePlacement = {
  id: string;
  roomId: string;
  label: string;
  sortOrder?: number;
};

/**
 * 논리 설계 §7 StorageLocation — 방 직속 또는 가구 아래 보관 슬롯
 * `furniturePlacementId`가 있으면 방 직속이 아님(roomId는 비워 두는 것을 권장, 해석은 가구→방).
 */
export type StorageLocationRow = {
  id: string;
  name: string;
  roomId: string | null;
  furniturePlacementId: string | null;
  sortOrder?: number;
};

/** 논리 설계 §6 Unit */
export type CatalogUnit = {
  id: string;
  symbol: string;
  name?: string;
  sortOrder?: number;
};

/** 논리 설계 §3 Category (플랫 1단계) */
export type CatalogCategory = {
  id: string;
  name: string;
  sortOrder?: number;
};

/** 논리 설계 §7 Product */
export type CatalogProduct = {
  id: string;
  categoryId: string;
  name: string;
  isConsumable: boolean;
  imageUrl?: string;
  description?: string;
};

/** 논리 설계 §8 ProductVariant (용량·포장) */
export type CatalogProductVariant = {
  id: string;
  productId: string;
  unitId: string;
  /** 1팩=6개 → 6, 1병=500ml → 500 */
  quantityPerUnit: number;
  name?: string;
  price?: number;
  sku?: string;
  isDefault?: boolean;
};

export type ProductCatalog = {
  units: CatalogUnit[];
  categories: CatalogCategory[];
  products: CatalogProduct[];
  variants: CatalogProductVariant[];
};

/**
 * 로컬 재고 행 — roomId = 구조 방 id (StorageLocation.roomId 개념과 동일).
 * Category / Product / ProductVariant 를 스냅샷 문자열 `name`과 함께 저장.
 */
export type InventoryRow = {
  id: string;
  name: string;
  /** 보유 수량(병·팩·박스 등 Variant 단위 기준) */
  quantity: number;
  /** 재고 수량의 단위 심볼 — Variant의 Unit.symbol 과 정합 */
  unit: string;
  roomId: string;
  /** 보관 장소(슬롯) — 있으면 방·가구 경로 표시에 사용 */
  storageLocationId?: string;
  notes?: string;
  categoryId?: string;
  productId?: string;
  productVariantId?: string;
  /** 용량·포장 표시 스냅샷 (예: 500ml, 5개입) */
  variantCaption?: string;
  quantityPerUnit?: number;
};

export type Household = {
  id: string;
  name: string;
  /** `HouseholdKindDefinition.id` 참조 */
  kind: string;
  rooms: StructureRoom[];
  items: InventoryRow[];
  /** 방별 가구 배치 — 없으면 UI에서 빈 배열로 취급 */
  furniturePlacements?: FurniturePlacement[];
  /** 보관 슬롯(방 직속 또는 가구 하위) */
  storageLocations?: StorageLocationRow[];
  createdAt: string;
};

export type AuthUser = {
  email: string;
  displayName: string;
};

export type GroupMember = {
  id: string;
  email: string;
  role: "owner" | "member";
  label?: string;
};

/**
 * ExpirationAlertRule 소유 축 — §18: userId XOR householdId, UI에서는 한 축만 쓰도록 안내.
 */
export type NotificationRuleScope = "household" | "personal";

/**
 * §17 Notification · §18 ExpirationAlertRule · InventoryItem.minStockLevel 와 맞춘 알림 상세(모의 저장).
 */
export type NotificationDetailPreferences = {
  /** 품목별 규칙의 기본값·신규 규칙 템플릿: 유통기한 N일 전 (daysBefore) */
  expirationDaysBefore: number;
  expirationRuleScope: NotificationRuleScope;
  /** Notification.type `expired` — 기한이 지난 PurchaseBatch */
  notifyExpiredLots: boolean;
  /** 만료 당일 한 번 더 알림(스케줄 정책; ERD는 품목당 규칙 1건 — 확장은 suggestion 참고) */
  expirationSameDayReminder: boolean;
  /** 리스트 항목 추가·변경 등 */
  shoppingNotifyListUpdates: boolean;
  /** 주간 장보기 습관용 리마인더 */
  shoppingTripReminder: boolean;
  /** 0=일 … 6=토, null이면 “요일 고정 없음” */
  shoppingTripReminderWeekday: number | null;
  /** true면 minStockLevel이 잡힌 재고만 알림(ERD: NULL이면 해당 알림 미사용) */
  lowStockRespectMinLevel: boolean;
};

export type AppSettings = {
  notifyExpiration: boolean;
  notifyShopping: boolean;
  notifyLowStock: boolean;
  groups: GroupMember[];
  notificationDetail: NotificationDetailPreferences;
};

export const DEFAULT_NOTIFICATION_DETAIL: NotificationDetailPreferences = {
  expirationDaysBefore: 3,
  expirationRuleScope: "household",
  notifyExpiredLots: true,
  expirationSameDayReminder: true,
  shoppingNotifyListUpdates: true,
  shoppingTripReminder: false,
  shoppingTripReminderWeekday: 6,
  lowStockRespectMinLevel: true,
};

export const DEFAULT_SETTINGS: AppSettings = {
  notifyExpiration: true,
  notifyShopping: true,
  notifyLowStock: false,
  groups: [],
  notificationDetail: DEFAULT_NOTIFICATION_DETAIL,
};
