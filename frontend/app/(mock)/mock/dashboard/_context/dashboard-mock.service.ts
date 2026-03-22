import { stripHouseholdCatalogForPersist } from "@/lib/household-persist";
import type { Household } from "@/types/domain";
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
        categoryId: "c-food",
        productId: "p-milk",
        productVariantId: "v-milk-500",
        variantCaption: "500ml",
        quantityPerUnit: 500,
      },
      {
        id: "mock-item-tissue",
        name: "생활용품 › 티슈 › 1박스",
        quantity: 3,
        unit: "박스",
        roomId: "mock-room-storage",
        storageLocationId: "sl-mock-storage-rack",
        categoryId: "c-life",
        productId: "p-tissue",
        productVariantId: "v-tissue-box",
        variantCaption: "1박스",
        quantityPerUnit: 1,
      },
      {
        id: "mock-item-remote",
        name: "전자·소모품 › 건전지 › AAA 4입",
        quantity: 2,
        unit: "팩",
        roomId: "mock-room-living",
        storageLocationId: "sl-mock-living-tv",
        notes: "AAA",
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
        categoryId: "c-office",
        productId: "p-a4",
        productVariantId: "v-a4-ream",
        variantCaption: "1권",
        quantityPerUnit: 1,
      },
    ],
  },
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
