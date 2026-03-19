import type { Household } from "@/types/domain";
import type { DashboardHouseholdsPort } from "./dashboard-households.port";

/** 네트워크 지연을 흉내 낸다 (Route Handler 연동 시 제거·단축 가능) */
const MOCK_LATENCY_MS = 200;

const MOCK_SEED_HOUSEHOLDS: Household[] = [
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
    items: [
      {
        id: "mock-item-ramen",
        name: "라면",
        quantity: 12,
        unit: "개",
        roomId: "mock-room-kitchen",
        notes: "비상 식량",
      },
      {
        id: "mock-item-tissue",
        name: "티슈",
        quantity: 3,
        unit: "박스",
        roomId: "mock-room-storage",
      },
      {
        id: "mock-item-remote",
        name: "리모컨 건전지",
        quantity: 4,
        unit: "개",
        roomId: "mock-room-living",
        notes: "AAA",
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
    items: [
      {
        id: "mock-item-paper",
        name: "A4 용지",
        quantity: 5,
        unit: "권",
        roomId: "mock-room-office-shelf",
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
      cache = cloneHouseholds(households);
    },
  };
}
