import { stripHouseholdCatalogForPersist } from "@/lib/household-persist";
import type {
  Household,
  InventoryLedgerRow,
  InventoryLedgerType,
} from "@/types/domain";
import type { DashboardHouseholdsPort } from "./dashboard-households.port";

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
