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
  /**
   * 구조도·편집 UI: 이 방 직속 보관 장소(StorageLocation) 아래에 가구를 매단다.
   * 없으면 방에서 곧바로 가구로만 이어진다.
   */
  anchorDirectStorageId?: string | null;
};

/**
 * 논리 설계 §7 StorageLocation — 가구 또는 가전 아래 보관 슬롯
 * `furniturePlacementId`가 있으면 가구 하위, `applianceId`가 있으면 가전 하위.
 * v2.8: 직속 보관 장소 계층 제거 — 보관 장소는 가구 또는 가전 하위에만 존재.
 */
export type StorageLocationRow = {
  id: string;
  name: string;
  roomId: string | null;
  furniturePlacementId: string | null;
  /** v2.8: 가전 하위 보관 장소 (필터·소모품 등) */
  applianceId?: string | null;
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
  /** 이하이면 부족으로 장보기 제안 등에 쓰임(미입력이면 부족 기준 없음) */
  minStockLevel?: number;
};

/**
 * ERD PurchaseBatch — 같은 유통기한을 공유하는 로트(클라이언트·로컬 저장용).
 */
export type PurchaseBatchLot = {
  id: string;
  /** 이 로트 수량(재고 Variant 단위와 동일하게 해석) */
  quantity: number;
  /** 유통기한 YYYY-MM-DD */
  expiresOn: string;
};

/**
 * ERD Purchase — 구매 1건과 그에 딸린 로트 목록(클라이언트·로컬 저장용).
 */
export type PurchaseRecord = {
  id: string;
  householdId: string;
  /** 연결 재고 행 — 없으면 수동 입력 품목만 */
  inventoryItemId?: string;
  productId?: string;
  productVariantId?: string;
  /** 목록·모달 표시용 */
  itemName: string;
  variantCaption?: string;
  unitSymbol: string;
  /** 구매일 YYYY-MM-DD */
  purchasedOn: string;
  unitPrice: number;
  totalPrice: number;
  supplierName?: string;
  batches: PurchaseBatchLot[];
};

/**
 * 대시보드 장보기 보조 목록 (`him-shopping-list`).
 * `inventoryItemId`가 있으면「구매 완료」시 해당 재고 수량이 늘어난다.
 */
export type ShoppingListEntry = {
  id: string;
  householdId: string;
  /** 연결 재고 — 없으면 메모·카탈로그만 연결 */
  inventoryItemId: string | null;
  /** 표시용 이름 — 카탈로그/재고에서 파생. 없으면 productId join으로 도출 */
  label?: string;
  unit?: string;
  variantCaption?: string;
  /** 카탈로그만 연결(아직 보관 장소 미지정) — 구매 완료 시 동일 품목·변형 재고가 있으면 보충 */
  categoryId?: string;
  productId?: string;
  productVariantId?: string;
  /** 구매 완료 시 더할 수량(재고 연결 시) */
  restockQuantity: number;
  createdAt: string;
  /** 장보기에서 미리 고른 넣을 보관 장소(선택) — 목록 표시·이후 보관 장소에 넣을 때 참고 */
  targetStorageLocationId?: string;
};

/** 논리 설계 §15 InventoryLog.type */
export type InventoryLedgerType = "in" | "out" | "adjust" | "waste";

/**
 * 재고 변경 이력(클라이언트·로컬 `him-inventory-ledger`).
 * ERD InventoryLog + 폐기 시 reason 등 UI 필드.
 */
export type InventoryLedgerRow = {
  id: string;
  householdId: string;
  inventoryItemId: string;
  type: InventoryLedgerType;
  quantityDelta: number;
  quantityAfter: number;
  /** 기록 시점 표시명(품목 삭제 후에도 이력 식별) */
  itemLabel?: string;
  memo?: string;
  refType?: string;
  refId?: string;
  /** 폐기 사유 코드·자유 입력 */
  reason?: string;
  createdAt: string;
};

/**
 * 구조도 캔버스에서 옮긴 노드 좌표.
 * 키: `slot:{storageLocationId}`(방 직속 보관 장소) · `fp:{furniturePlacementId}`(가구)
 */
export type HouseholdStructureDiagramLayout = Record<
  string,
  { x: number; y: number }
>;

/** ERD HouseholdMember 역할 — admin(관리자) / editor(편집자) / viewer(조회자) */
export type MemberRole = "admin" | "editor" | "viewer";

/** 거점·설정에서 공유 — ERD HouseholdMember 역할(모의) */
export type GroupMember = {
  id: string;
  email: string;
  role: MemberRole;
  label?: string;
};

export type AuthUser = {
  email: string;
  displayName: string;
  /** 모의: 이메일 인증 완료 여부(백엔드 `emailVerifiedAt` 대응) */
  emailVerified?: boolean;
};

export type Household = {
  id: string;
  name: string;
  /** `HouseholdKindDefinition.id` 참조 */
  kind: string;
  rooms: StructureRoom[];
  items: InventoryRow[];
  /** 방별 가구 — 없으면 UI에서 빈 배열로 취급 */
  furniturePlacements?: FurniturePlacement[];
  /** 보관 슬롯(방 직속 또는 가구 하위) */
  storageLocations?: StorageLocationRow[];
  /** 조회 모드 구조도: 직속·가구 블록 수동 배치(방 좌표는 rooms[].x/y) */
  structureDiagramLayout?: HouseholdStructureDiagramLayout;
  createdAt: string;
  /** 거점별 공유 멤버(모의). ERD Household ↔ User 멤버십과 대응 */
  members?: GroupMember[];
  /** 거점별 상품 카탈로그 — v2.1 Household-scoped (Category·Unit·Product) */
  catalog?: ProductCatalog;
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

/**
 * ERD §20 ExpirationAlertRule — 품목별 유통기한 알림 일수 오버라이드(클라이언트·로컬 저장용).
 * 전역 기본값(`NotificationDetailPreferences.expirationDaysBefore`)과 다른 품목만 등록.
 */
export type ExpirationAlertRule = {
  id: string;
  /** CatalogProduct.id */
  productId: string;
  /** 유통기한 N일 전 알림 */
  daysBefore: number;
  isActive: boolean;
};

export type AppSettings = {
  notifyExpiration: boolean;
  notifyShopping: boolean;
  notifyLowStock: boolean;
  groups: GroupMember[];
  notificationDetail: NotificationDetailPreferences;
  /** 품목별 만료 알림 일수 오버라이드 */
  expirationAlertRules: ExpirationAlertRule[];
};

/** ERD §19 Notification — 알림 수신 항목(클라이언트·로컬 저장용) */
export type NotificationType =
  | "expiration_soon"
  | "expired"
  | "low_stock"
  | "shopping_reminder"
  | "shopping_list_update";

export type NotificationItem = {
  id: string;
  householdId: string;
  type: NotificationType;
  title: string;
  body?: string;
  readAt: string | null;
  /** 연관 엔티티(InventoryItem, PurchaseBatch 등) */
  refType?: string;
  refId?: string;
  createdAt: string;
};

/* ─────────────────────── 가전/설비 (Appliance) ─────────────────────── */

/** 가전 상태 */
export type ApplianceStatus = "active" | "disposed";

/** 유지보수 반복 규칙 */
export type MaintenanceRepeatRule =
  | "monthly"
  | "quarterly"
  | "semiannual"
  | "annual";

/** 유지보수 이력 유형 */
export type MaintenanceLogType = "scheduled" | "repair" | "inspection";

/** 가전/설비 등록 정보 */
export type Appliance = {
  id: string;
  householdId: string;
  name: string;
  brand?: string;
  modelName?: string;
  /** 구매일 YYYY-MM-DD */
  purchasedOn?: string;
  /** 보증 만료일 YYYY-MM-DD */
  warrantyExpiresOn?: string;
  /** 설치 위치 — StructureRoom.id */
  roomId?: string;
  status: ApplianceStatus;
  /** 폐기일 YYYY-MM-DD */
  disposedOn?: string;
  createdAt: string;
};

/** 유지보수 스케줄 */
export type MaintenanceSchedule = {
  id: string;
  applianceId: string;
  taskName: string;
  repeatRule: MaintenanceRepeatRule;
  /** 시작일 YYYY-MM-DD */
  startDate: string;
  /** 다음 예정일 YYYY-MM-DD (자동 갱신) */
  nextDueDate: string;
  isActive: boolean;
};

/** 유지보수·A/S 이력 */
export type MaintenanceLog = {
  id: string;
  applianceId: string;
  /** 연결된 스케줄 (정기 유지보수 완료 시) */
  scheduleId?: string;
  type: MaintenanceLogType;
  description: string;
  /** 업체명 (수리 시) */
  providerName?: string;
  /** 비용 (수리 시) */
  cost?: number;
  completedOn: string;
  createdAt: string;
};

/** 모의 초대 링크 — 백엔드 연동 전 로컬 전용 */
export type MockInvitation = {
  id: string;
  householdId: string;
  role: MemberRole;
  token: string;
  createdAt: string;
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
  expirationAlertRules: [],
};
