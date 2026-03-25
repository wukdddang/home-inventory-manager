import { stripHouseholdCatalogForPersist } from "@/lib/household-persist";
import type {
  Household,
  InventoryLedgerRow,
  InventoryLedgerType,
  NotificationItem,
  ProductCatalog,
} from "@/types/domain";
import type { DashboardHouseholdsPort } from "./dashboard-households.port";

/* ── 상품 카탈로그 기본 시드 ── */

/** 시드·신규 거점에 붙이는 기본 마스터 데이터 */
export const DEFAULT_PRODUCT_CATALOG: ProductCatalog = {
  units: [
    { id: "u-ml", symbol: "ml", name: "밀리리터", sortOrder: 1 },
    { id: "u-l", symbol: "L", name: "리터", sortOrder: 2 },
    { id: "u-g", symbol: "g", name: "그램", sortOrder: 3 },
    { id: "u-ea", symbol: "개", name: "개", sortOrder: 4 },
    { id: "u-bottle", symbol: "병", name: "병", sortOrder: 5 },
    { id: "u-pack", symbol: "팩", name: "팩", sortOrder: 6 },
    { id: "u-box", symbol: "박스", name: "박스", sortOrder: 7 },
    { id: "u-ream", symbol: "권", name: "권", sortOrder: 8 },
  ],
  categories: [
    { id: "c-food", name: "식료품", sortOrder: 1 },
    { id: "c-life", name: "생활용품", sortOrder: 2 },
    { id: "c-office", name: "사무용품", sortOrder: 3 },
    { id: "c-electronics", name: "전자·소모품", sortOrder: 4 },
  ],
  products: [
    {
      id: "p-milk",
      categoryId: "c-food",
      name: "우유",
      isConsumable: true,
      imageUrl: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=128&h=128&fit=crop&q=80",
    },
    {
      id: "p-ramen",
      categoryId: "c-food",
      name: "라면",
      isConsumable: true,
      imageUrl: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=128&h=128&fit=crop&q=80",
    },
    {
      id: "p-tissue",
      categoryId: "c-life",
      name: "티슈",
      isConsumable: true,
      imageUrl: "https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=128&h=128&fit=crop&q=80",
    },
    {
      id: "p-a4",
      categoryId: "c-office",
      name: "A4 용지",
      isConsumable: true,
      imageUrl: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=128&h=128&fit=crop&q=80",
    },
    {
      id: "p-battery",
      categoryId: "c-electronics",
      name: "건전지",
      isConsumable: true,
      imageUrl: "https://images.unsplash.com/photo-1619641805634-98e5c37150f1?w=128&h=128&fit=crop&q=80",
    },
  ],
  variants: [
    { id: "v-milk-500", productId: "p-milk", unitId: "u-bottle", quantityPerUnit: 500, name: "500ml", isDefault: true },
    { id: "v-milk-1l", productId: "p-milk", unitId: "u-bottle", quantityPerUnit: 1000, name: "1L" },
    { id: "v-ramen-1", productId: "p-ramen", unitId: "u-ea", quantityPerUnit: 1, name: "1봉", isDefault: true },
    { id: "v-ramen-5", productId: "p-ramen", unitId: "u-pack", quantityPerUnit: 5, name: "5개입" },
    { id: "v-tissue-box", productId: "p-tissue", unitId: "u-box", quantityPerUnit: 1, name: "1박스", isDefault: true },
    { id: "v-a4-ream", productId: "p-a4", unitId: "u-ream", quantityPerUnit: 1, name: "1권", isDefault: true },
    { id: "v-battery-aaa", productId: "p-battery", unitId: "u-pack", quantityPerUnit: 4, name: "AAA 4입", isDefault: true },
  ],
};

export function cloneDefaultCatalog(): ProductCatalog {
  return structuredClone(DEFAULT_PRODUCT_CATALOG);
}

/* ── 거점 mock ── */

/** 네트워크 지연을 흉내 낸다 (Route Handler 연동 시 제거·단축 가능) */
const MOCK_LATENCY_MS = 200;

/** 대시보드 mock·구매·로트 mock 등에서 동일 거점 스냅샷으로 재사용 */
export const MOCK_SEED_HOUSEHOLDS: Household[] = [
  {
    id: "mock-household-home",
    name: "우리 집",
    kind: "home",
    createdAt: "2025-01-10T08:00:00.000Z",
    rooms: [
      {
        id: "mock-room-living",
        name: "거실",
        x: 24,
        y: 24,
        width: 180,
        height: 110,
      },
      {
        id: "mock-room-kitchen",
        name: "주방",
        x: 224,
        y: 24,
        width: 180,
        height: 110,
      },
      {
        id: "mock-room-storage",
        name: "창고",
        x: 24,
        y: 154,
        width: 180,
        height: 110,
      },
    ],
    furniturePlacements: [
      {
        id: "fp-mock-kitchen-shelf",
        roomId: "mock-room-kitchen",
        label: "주방 선반",
        sortOrder: 1,
        anchorDirectStorageId: "sl-mock-kitchen-wall",
      },
    ],
    storageLocations: [
      {
        id: "sl-mock-kitchen-wall",
        name: "벽면장",
        roomId: "mock-room-kitchen",
        furniturePlacementId: null,
        sortOrder: 0,
      },
      {
        id: "sl-mock-kitchen-fridge",
        name: "냉장고",
        roomId: "mock-room-kitchen",
        furniturePlacementId: null,
        sortOrder: 1,
      },
      {
        id: "sl-mock-kitchen-shelf-top",
        name: "윗칸",
        roomId: null,
        furniturePlacementId: "fp-mock-kitchen-shelf",
        sortOrder: 1,
      },
      {
        id: "sl-mock-storage-rack",
        name: "선반",
        roomId: "mock-room-storage",
        furniturePlacementId: null,
        sortOrder: 1,
      },
      {
        id: "sl-mock-living-tv",
        name: "TV 장 서랍",
        roomId: "mock-room-living",
        furniturePlacementId: null,
        sortOrder: 1,
      },
    ],
    items: [
      {
        id: "mock-item-ramen",
        name: "식료품 › 라면 › 1봉",
        quantity: 12,
        unit: "개",
        roomId: "mock-room-kitchen",
        storageLocationId: "sl-mock-kitchen-fridge",
        notes: "비상 식량",
        categoryId: "c-food",
        productId: "p-ramen",
        productVariantId: "v-ramen-1",
        variantCaption: "1봉",
        quantityPerUnit: 1,
      },
      {
        id: "mock-item-milk-shelf",
        name: "식료품 › 우유 › 500ml",
        quantity: 2,
        unit: "병",
        roomId: "mock-room-kitchen",
        storageLocationId: "sl-mock-kitchen-shelf-top",
        notes: "장보기 제안 데모: 유통기한 임박(로트) + 최소 재고 미달",
        categoryId: "c-food",
        productId: "p-milk",
        productVariantId: "v-milk-500",
        variantCaption: "500ml",
        quantityPerUnit: 500,
        /** 최소 4병 유지 가정 → 현재 2병으로「재고 부족」배지 */
        minStockLevel: 4,
      },
      {
        id: "mock-item-tissue",
        name: "생활용품 › 티슈 › 1박스",
        quantity: 3,
        unit: "박스",
        roomId: "mock-room-storage",
        storageLocationId: "sl-mock-storage-rack",
        notes: "장보기 제안 데모: 구매 로트 없음 →「재고 부족」만",
        categoryId: "c-life",
        productId: "p-tissue",
        productVariantId: "v-tissue-box",
        variantCaption: "1박스",
        quantityPerUnit: 1,
        minStockLevel: 6,
      },
      {
        id: "mock-item-remote",
        name: "전자·소모품 › 건전지 › AAA 4입",
        quantity: 2,
        unit: "팩",
        roomId: "mock-room-living",
        storageLocationId: "sl-mock-living-tv",
        notes: "AAA · 장보기 제안 데모: 유통기한 임박(로트)만",
        categoryId: "c-electronics",
        productId: "p-battery",
        productVariantId: "v-battery-aaa",
        variantCaption: "AAA 4입",
        quantityPerUnit: 4,
      },
    ],
  },
  {
    id: "mock-household-office",
    name: "사무실 창고",
    kind: "office",
    createdAt: "2025-02-01T10:30:00.000Z",
    rooms: [
      {
        id: "mock-room-office-shelf",
        name: "선반 구역",
        x: 40,
        y: 40,
        width: 200,
        height: 120,
      },
    ],
    furniturePlacements: [],
    storageLocations: [
      {
        id: "sl-mock-office-shelf",
        name: "책상 옆 선반",
        roomId: "mock-room-office-shelf",
        furniturePlacementId: null,
        sortOrder: 1,
      },
    ],
    items: [
      {
        id: "mock-item-paper",
        name: "사무용품 › A4 용지 › 1권",
        quantity: 5,
        unit: "권",
        roomId: "mock-room-office-shelf",
        storageLocationId: "sl-mock-office-shelf",
        notes: "장보기 제안 데모: 로트 만료 임박(당일)·수량은 최소 재고 이상",
        categoryId: "c-office",
        productId: "p-a4",
        productVariantId: "v-a4-ream",
        variantCaption: "1권",
        quantityPerUnit: 1,
        minStockLevel: 2,
      },
    ],
  },
];

/**
 * 재고 이력 mock: 오늘 기준 dayOffset일의 로컬 시각 → ISO
 * (기간 필터·표의 일시가 같은 달력 기준을 쓰도록 함)
 */
function mockLedger로컬날짜시각을_만든다(
  dayOffsetFromToday: number,
  hour: number,
  minute: number,
): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + dayOffsetFromToday);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/** 재고 이력 목 페이지네이션 확인용 — 기본 8건 외 추가 행 */
function mockInventoryLedgerExtraRows(): InventoryLedgerRow[] {
  const items = [
    {
      inventoryItemId: "mock-item-ramen",
      itemLabel: "식료품 › 라면 › 1봉",
    },
    {
      inventoryItemId: "mock-item-milk-shelf",
      itemLabel: "식료품 › 우유 › 500ml",
    },
    {
      inventoryItemId: "mock-item-tissue",
      itemLabel: "생활용품 › 티슈 › 1박스",
    },
    {
      inventoryItemId: "mock-item-remote",
      itemLabel: "전자·소모품 › 건전지 › AAA 4입",
    },
    {
      inventoryItemId: "mock-item-paper",
      itemLabel: "사무용품 › A4 용지 › 1권",
    },
  ] as const;
  const types: InventoryLedgerType[] = ["in", "out", "adjust", "waste"];
  const households = ["mock-household-home", "mock-household-office"] as const;
  const wasteReasons = ["expired", "damaged", "other"] as const;

  const rows: InventoryLedgerRow[] = [];
  for (let i = 0; i < 42; i++) {
    const type = types[i % 4]!;
    const item = items[i % items.length]!;
    const householdId = households[i % 2]!;
    const hour = 7 + (i % 12);
    const minute = (i * 11) % 60;
    let quantityDelta: number;
    if (type === "in") {
      quantityDelta = 1 + (i % 5);
    } else if (type === "out" || type === "waste") {
      quantityDelta = -(1 + (i % 4));
    } else {
      quantityDelta = i % 2 === 0 ? 1 : -1;
    }
    const quantityAfter = Math.max(0, 16 + (i % 9) + quantityDelta);
    rows.push({
      id: `mock-ledger-${String(9 + i).padStart(3, "0")}`,
      householdId,
      inventoryItemId: item.inventoryItemId,
      type,
      quantityDelta,
      quantityAfter,
      itemLabel: item.itemLabel,
      memo: i % 6 === 0 ? `목 데이터 일괄 생성 #${i + 1}` : undefined,
      reason:
        type === "waste" ? wasteReasons[i % 3]! : undefined,
      createdAt: mockLedger로컬날짜시각을_만든다(
        -(1 + (i % 28)),
        hour,
        minute,
      ),
    });
  }
  return rows;
}

/** 재고 이력(mock) 페이지 등에서 동일 시드로 재사용 — 일시는 항상 «오늘» 기준 상대 날짜 */
function buildMockInventoryLedgerBase(): InventoryLedgerRow[] {
  const iso = mockLedger로컬날짜시각을_만든다;
  return [
    {
      id: "mock-ledger-001",
      householdId: "mock-household-home",
      inventoryItemId: "mock-item-ramen",
      type: "in",
      quantityDelta: 6,
      quantityAfter: 12,
      itemLabel: "식료품 › 라면 › 1봉",
      memo: "장보기 구매 반영",
      refType: "purchase",
      refId: "mock-purchase-1",
      createdAt: iso(-1, 9, 15),
    },
    {
      id: "mock-ledger-002",
      householdId: "mock-household-home",
      inventoryItemId: "mock-item-milk-shelf",
      type: "out",
      quantityDelta: -1,
      quantityAfter: 1,
      itemLabel: "식료품 › 우유 › 500ml",
      memo: "아침에 사용",
      createdAt: iso(-2, 18, 40),
    },
    {
      id: "mock-ledger-003",
      householdId: "mock-household-home",
      inventoryItemId: "mock-item-milk-shelf",
      type: "waste",
      quantityDelta: -1,
      quantityAfter: 0,
      itemLabel: "식료품 › 우유 › 500ml",
      reason: "expired",
      memo: "냉장고 맨 뒤에서 발견",
      createdAt: iso(-3, 11, 5),
    },
    {
      id: "mock-ledger-004",
      householdId: "mock-household-home",
      inventoryItemId: "mock-item-tissue",
      type: "out",
      quantityDelta: -1,
      quantityAfter: 2,
      itemLabel: "생활용품 › 티슈 › 1박스",
      createdAt: iso(-4, 8, 0),
    },
    {
      id: "mock-ledger-005",
      householdId: "mock-household-home",
      inventoryItemId: "mock-item-ramen",
      type: "out",
      quantityDelta: -2,
      quantityAfter: 6,
      itemLabel: "식료품 › 라면 › 1봉",
      memo: "야식",
      createdAt: iso(-5, 23, 10),
    },
    {
      id: "mock-ledger-006",
      householdId: "mock-household-office",
      inventoryItemId: "mock-item-paper",
      type: "adjust",
      quantityDelta: 1,
      quantityAfter: 5,
      itemLabel: "사무용품 › A4 용지 › 1권",
      memo: "실사 후 재고 맞춤",
      createdAt: iso(-6, 16, 45),
    },
    {
      id: "mock-ledger-007",
      householdId: "mock-household-office",
      inventoryItemId: "mock-item-paper",
      type: "out",
      quantityDelta: -2,
      quantityAfter: 4,
      itemLabel: "사무용품 › A4 용지 › 1권",
      createdAt: iso(-7, 10, 20),
    },
    {
      id: "mock-ledger-008",
      householdId: "mock-household-home",
      inventoryItemId: "mock-item-remote",
      type: "waste",
      quantityDelta: -1,
      quantityAfter: 1,
      itemLabel: "전자·소모품 › 건전지 › AAA 4입",
      reason: "damaged",
      createdAt: iso(-8, 14, 0),
    },
  ];
}

export const MOCK_SEED_INVENTORY_LEDGER: InventoryLedgerRow[] = [
  ...buildMockInventoryLedgerBase(),
  ...mockInventoryLedgerExtraRows(),
];

function buildMockNotifications(): NotificationItem[] {
  const now = Date.now();
  const h = (hours: number) => new Date(now - hours * 3_600_000).toISOString();
  const hId = "mock-household-home";

  return [
    {
      id: "notif-1",
      householdId: hId,
      type: "expiration_soon",
      title: "우유 유통기한이 2일 남았습니다",
      body: "주방 냉장고 · 서울우유 1L",
      readAt: null,
      refType: "InventoryItem",
      refId: "mock-item-milk",
      createdAt: h(1),
    },
    {
      id: "notif-2",
      householdId: hId,
      type: "expired",
      title: "식빵 유통기한이 지났습니다",
      body: "주방 선반 · 신라명과 식빵 — 어제 만료",
      readAt: null,
      refType: "InventoryItem",
      refId: "mock-item-bread",
      createdAt: h(3),
    },
    {
      id: "notif-3",
      householdId: hId,
      type: "low_stock",
      title: "계란 재고가 부족합니다",
      body: "현재 2개 / 최소 재고 6개",
      readAt: null,
      refType: "InventoryItem",
      refId: "mock-item-egg",
      createdAt: h(5),
    },
    {
      id: "notif-4",
      householdId: hId,
      type: "shopping_reminder",
      title: "이번 주 장보기 리마인더",
      body: "장보기 목록에 3개 항목이 있습니다.",
      readAt: null,
      createdAt: h(8),
    },
    {
      id: "notif-5",
      householdId: hId,
      type: "shopping_list_update",
      title: "장보기 목록이 변경되었습니다",
      body: "김데모 님이 '세제'를 추가했습니다.",
      readAt: h(6),
      createdAt: h(24),
    },
    {
      id: "notif-6",
      householdId: hId,
      type: "expiration_soon",
      title: "요거트 유통기한이 3일 남았습니다",
      body: "주방 냉장고 · 플레인 요거트 450g",
      readAt: h(10),
      refType: "InventoryItem",
      createdAt: h(26),
    },
    {
      id: "notif-7",
      householdId: hId,
      type: "low_stock",
      title: "두루마리 화장지 재고 부족",
      body: "현재 1개 / 최소 재고 4개",
      readAt: h(20),
      createdAt: h(48),
    },
  ];
}

export const MOCK_SEED_NOTIFICATIONS: NotificationItem[] =
  buildMockNotifications();

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function cloneHouseholds(list: Household[]): Household[] {
  return structuredClone(list);
}

/**
 * 백엔드 미연결 시 사용하는 인메모리 mock.
 * `list` 최초 호출 시 시드 데이터를 채우고, 이후 `saveAll` 스냅샷을 유지한다.
 */
export function createDashboardMockHouseholdsService(): DashboardHouseholdsPort {
  let cache: Household[] | null = null;

  return {
    async list() {
      await delay(MOCK_LATENCY_MS);
      if (cache === null) {
        cache = cloneHouseholds(MOCK_SEED_HOUSEHOLDS);
      }
      return cloneHouseholds(cache);
    },

    async saveAll(households) {
      await delay(Math.min(80, MOCK_LATENCY_MS));
      cache = cloneHouseholds(households).map(stripHouseholdCatalogForPersist);
    },
  };
}
