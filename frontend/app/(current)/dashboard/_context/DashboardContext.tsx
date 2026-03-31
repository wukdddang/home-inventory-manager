"use client";

/**
 * Dashboard 베이스 Provider + API 서비스 주입 래퍼.
 *
 * 구조:
 *   DashboardProvider      — port 를 주입받아 동작하는 베이스 Provider.
 *                            mock/api 구분 없이 공통 상태·이벤트 로직을 담당한다.
 *   CurrentDashboardProvider — dashboardApiHouseholdsClient 를 주입하는 API 전용 래퍼.
 *
 * mock 전용 래퍼(MockDashboardProvider)는
 * `(mock)/mock/dashboard/_context/DashboardContext` 에 있다.
 *
 * Port 인터페이스: `./dashboard-households.port`
 * API 서비스 구현: `./dashboard-api.service`
 * Mock 서비스 구현: `(mock)/mock/dashboard/_context/dashboard-mock.service`
 */

import {
  createContext,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ensureHouseholdShape } from "@/lib/household-location";
import {
  cloneDefaultHouseholdKindDefinitions,
  sortHouseholdKindDefinitions,
} from "@/lib/household-kind-defaults";
import {
  appendInventoryLedgerRow,
  getSharedHouseholdKindDefinitions,
  getPurchases,
} from "@/lib/local-store";
import { 유통기한까지_일수를_구한다 } from "@/lib/purchase-lot-helpers";
import { getMockPurchasesSession } from "@/app/(mock)/mock/purchases/_context/purchases-mock.service";
import type {
  FurniturePlacement,
  Household,
  HouseholdKindDefinition,
  HouseholdStructureDiagramLayout,
  InventoryRow,
  MemberRole,
  MockInvitation,
  ProductCatalog,
  StorageLocationRow,
  StructureRoom,
} from "@/types/domain";
import { newEntityId } from "@/app/(mock)/mock/dashboard/_lib/dashboard-helpers";
import { cloneDefaultCatalog } from "@/app/(mock)/mock/dashboard/_context/dashboard-mock.service";
import { dashboardApiHouseholdsClient } from "./dashboard-api.service";
import type {
  CreateInvitationParams,
  DashboardHouseholdsPort,
  PurchaseBatchDto,
} from "./dashboard-households.port";

function normalizeHouseholdKinds(
  list: Household[],
  defs: HouseholdKindDefinition[],
): Household[] {
  const valid = new Set(defs.map((d) => d.id));
  const fallback = defs[0]?.id ?? "home";
  return list.map((h) => ({
    ...ensureHouseholdShape(h),
    kind: valid.has(h.kind) ? h.kind : fallback,
  }));
}

/** URL이 `/mock/...` 이면 mock, 그 외는 api */
export type DashboardHouseholdsDataMode = "mock" | "api";

/** 유통기한 임박·만료 알림 아이템. 거점별로 context에서 관리한다. */
export type ExpiryAlertItem = {
  item: InventoryRow;
  daysLeft: number;
  isExpired: boolean;
};

export type DashboardContextType = {
  dataMode: DashboardHouseholdsDataMode;
  households: Household[];
  거점_카탈로그를_가져온다: (householdId: string) => ProductCatalog;
  householdKindDefinitions: HouseholdKindDefinition[];
  householdKindsHydrated: boolean;
  loading: boolean;
  error: string | null;
  거점_목록을_불러온다: () => void;
  거점을_추가_한다: (name: string, kind: string) => Promise<string>;
  거점_기본정보를_수정_한다: (
    id: string,
    name: string,
    kind: string,
  ) => Promise<void>;
  거점_유형_정의를_교체_한다: (
    next: HouseholdKindDefinition[],
  ) => Promise<void>;
  거점을_삭제_한다: (householdId: string) => Promise<void>;
  거점을_갱신_한다: (
    householdId: string,
    updater: (h: Household) => Household,
  ) => void;
  카탈로그를_갱신_한다: (
    householdId: string,
    updater: (c: ProductCatalog) => ProductCatalog,
  ) => void;
  // ── 방 / 집 구조 ──
  /**
   * 방 목록을 상태에 반영하고 API에 동기화한다.
   * rooms sync API(논리 방 목록) + house-structure API(2D 좌표)를 순차 호출하고
   * 서버에서 할당된 UUID가 반영된 StructureRoom 배열을 반환한다.
   */
  방_목록을_동기화_한다: (
    householdId: string,
    rooms: StructureRoom[],
    layout?: HouseholdStructureDiagramLayout,
  ) => Promise<StructureRoom[]>;
  /**
   * 집 구조 다이어그램 레이아웃을 저장한다.
   * rooms를 전달하면 방 좌표도 함께 업데이트한다 (방 위치 드래그 시 사용).
   */
  집_구조를_저장_한다: (
    householdId: string,
    layout: HouseholdStructureDiagramLayout,
    rooms?: StructureRoom[],
  ) => Promise<void>;
  // ── 가구 배치 ──
  /** 방에 가구 배치를 생성한다. 서버 응답 객체(서버 UUID 포함)를 반환한다. */
  가구를_추가_한다: (
    householdId: string,
    roomId: string,
    label: string,
    anchorDirectStorageId?: string | null,
    sortOrder?: number,
  ) => Promise<FurniturePlacement | null>;
  /** 가구 배치의 앵커 직속 보관 장소를 변경한다 (로컬 + API). */
  가구_앵커를_변경_한다: (
    householdId: string,
    furnitureId: string,
    newSlotId: string | null,
  ) => Promise<void>;
  /** 가구 배치와 그 아래 세부 보관 장소·재고를 삭제한다 (로컬 + API). */
  가구를_삭제_한다: (householdId: string, furnitureId: string) => Promise<void>;
  // ── 보관 장소 ──
  /** 보관 장소를 생성한다. 서버 응답 객체(서버 UUID 포함)를 반환한다. */
  보관장소를_추가_한다: (
    householdId: string,
    data: {
      name: string;
      roomId?: string | null;
      furniturePlacementId?: string | null;
      sortOrder?: number;
    },
  ) => Promise<StorageLocationRow | null>;
  /** 보관 장소 이름을 수정한다 (로컬 + API). */
  보관장소_이름을_수정_한다: (
    householdId: string,
    slotId: string,
    name: string,
  ) => Promise<void>;
  /** 보관 장소를 삭제하고 연결된 가구 앵커를 폴백 처리한다 (로컬 + API). */
  보관장소를_삭제_한다: (
    householdId: string,
    slotId: string,
  ) => Promise<void>;
  // ── 멤버 ──
  멤버_역할을_변경_한다: (
    householdId: string,
    memberId: string,
    role: MemberRole,
  ) => Promise<void>;
  멤버를_제거_한다: (householdId: string, memberId: string) => Promise<void>;
  // ── 초대 ──
  초대를_생성_한다: (
    householdId: string,
    params: CreateInvitationParams,
  ) => Promise<MockInvitation>;
  초대_목록을_불러온다: (householdId: string) => Promise<MockInvitation[]>;
  초대를_취소_한다: (
    householdId: string,
    invitationId: string,
  ) => Promise<void>;
  // ── 재고 ──
  재고_소비를_기록_한다: (
    householdId: string,
    itemId: string,
    quantity: number,
    memo?: string,
  ) => boolean;
  재고_폐기를_기록_한다: (
    householdId: string,
    itemId: string,
    quantity: number,
    reasonCode: string,
    memo?: string,
  ) => boolean;
  재고_장보기_보충을_기록_한다: (
    householdId: string,
    itemId: string,
    quantity: number,
    memo?: string,
    refId?: string,
  ) => boolean;
  /**
   * 재고 품목을 등록한다.
   * api 모드: POST /inventory-items → 서버 할당 id 를 row 에 반영 후 로컬 상태 추가.
   * mock 모드: 로컬 상태에만 추가.
   * 실패 시 null 반환.
   */
  재고_품목을_등록_한다: (
    householdId: string,
    row: InventoryRow,
  ) => Promise<InventoryRow | null>;
  /**
   * 구매 기록을 재고 품목에 연결한다 (PATCH /purchases/:pid/link-inventory).
   * api 모드만 실제 API 호출; mock은 no-op.
   */
  구매에_재고를_연결_한다: (
    householdId: string,
    purchaseId: string,
    inventoryItemId: string,
  ) => Promise<void>;
  /**
   * 재고 수량을 수동 조정한다 (delta).
   * api 모드: POST /logs/adjustment + 로컬 상태 반영.
   * mock 모드: 로컬 상태만 반영.
   */
  재고_수량을_수동_조정_한다: (
    householdId: string,
    itemId: string,
    quantityDelta: number,
    memo?: string,
  ) => boolean;
  /**
   * 재고 수량을 절댓값으로 직접 설정한다.
   * api 모드: PATCH /inventory-items/:id/quantity + 로컬 상태 반영.
   * mock 모드: 로컬 상태만 반영.
   */
  재고_수량을_직접_설정_한다: (
    householdId: string,
    itemId: string,
    newQuantity: number,
    memo?: string,
  ) => boolean;
  /** 거점의 유통기한 임박 품목 목록을 반환한다 (API 기반). */
  거점_유통기한_임박_목록을_가져온다: (householdId: string) => ExpiryAlertItem[];
  /** 거점의 만료된 품목 목록을 반환한다 (API 기반). */
  거점_만료_목록을_가져온다: (householdId: string) => ExpiryAlertItem[];
};

export type DashboardProviderProps = {
  children: ReactNode;
  port: DashboardHouseholdsPort;
  dataMode: DashboardHouseholdsDataMode;
};

export const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined,
);

export function DashboardProvider({
  children,
  port,
  dataMode,
}: DashboardProviderProps) {
  const [households, setHouseholdsState] = useState<Household[]>([]);
  const [householdKindDefinitions, setHouseholdKindDefinitions] = useState<
    HouseholdKindDefinition[]
  >(() => cloneDefaultHouseholdKindDefinitions());
  const [householdKindsHydrated, setHouseholdKindsHydrated] = useState(false);
  const kindDefsRef = useRef(householdKindDefinitions);

  useLayoutEffect(() => {
    kindDefsRef.current = householdKindDefinitions;
  }, [householdKindDefinitions]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const householdsRef = useRef(households);

  // ── 유통기한 임박·만료 상태 (거점 ID → 목록) ──
  const [expiryAlertsByHousehold, setExpiryAlertsByHousehold] = useState<
    Record<string, ExpiryAlertItem[]>
  >({});
  const [expiredAlertsByHousehold, setExpiredAlertsByHousehold] = useState<
    Record<string, ExpiryAlertItem[]>
  >({});

  useLayoutEffect(() => {
    householdsRef.current = households;
  }, [households]);

  // ── 거점 유형 초기 로드 ──
  useEffect(() => {
    void (async () => {
      try {
        const kinds = await port.listKinds();
        setHouseholdKindDefinitions(
          kinds.length > 0 ? kinds : cloneDefaultHouseholdKindDefinitions(),
        );
      } catch {
        setHouseholdKindDefinitions(getSharedHouseholdKindDefinitions());
      } finally {
        setHouseholdKindsHydrated(true);
      }
    })();
  }, [port]);

  // ── 거점 상태 변경 시 포트로 전체 저장 동기화 ──
  useEffect(() => {
    if (!hydrated) return;
    void port.saveAll(households);
  }, [households, hydrated, port]);

  // ── 유통기한 임박·만료 데이터 로드 (거점별 배치 API → items 조인) ──
  const 거점_유통기한_임박_만료_를_로드_한다 = useCallback(
    async (loadedHouseholds: Household[]) => {
      const purchaseList =
        dataMode === "mock" ? getMockPurchasesSession() : getPurchases();

      const toExpiryItem = (
        batch: PurchaseBatchDto,
        isExpired: boolean,
        householdItems: InventoryRow[],
      ): ExpiryAlertItem | null => {
        const purchase = purchaseList.find((p) => p.id === batch.purchaseId);
        if (!purchase?.inventoryItemId) return null;
        const item = householdItems.find((i) => i.id === purchase.inventoryItemId);
        if (!item) return null;
        const dateStr = batch.expirationDate?.slice(0, 10) ?? null;
        if (!dateStr) return null;
        const daysLeft = 유통기한까지_일수를_구한다(dateStr);
        if (daysLeft === null) return null;
        return { item, daysLeft, isExpired };
      };

      const results = await Promise.all(
        loadedHouseholds.map(async (h) => {
          const [expiringBatches, expiredBatches] = await Promise.all([
            port.loadExpiringBatches(h.id).catch(() => [] as PurchaseBatchDto[]),
            port.loadExpiredBatches(h.id).catch(() => [] as PurchaseBatchDto[]),
          ]);

          // 같은 품목의 여러 배치 중 가장 임박한 것만 남긴다
          const expiringByItem = new Map<string, ExpiryAlertItem>();
          for (const b of expiringBatches) {
            const it = toExpiryItem(b, false, h.items);
            if (!it) continue;
            const ex = expiringByItem.get(it.item.id);
            if (!ex || it.daysLeft < ex.daysLeft) expiringByItem.set(it.item.id, it);
          }

          const expiredByItem = new Map<string, ExpiryAlertItem>();
          for (const b of expiredBatches) {
            const it = toExpiryItem(b, true, h.items);
            if (!it) continue;
            const ex = expiredByItem.get(it.item.id);
            if (!ex || it.daysLeft < ex.daysLeft) expiredByItem.set(it.item.id, it);
          }

          return {
            householdId: h.id,
            expiring: Array.from(expiringByItem.values()).sort(
              (a, b) => a.daysLeft - b.daysLeft,
            ),
            expired: Array.from(expiredByItem.values()).sort(
              (a, b) => a.daysLeft - b.daysLeft,
            ),
          };
        }),
      );

      const nextExpiring: Record<string, ExpiryAlertItem[]> = {};
      const nextExpired: Record<string, ExpiryAlertItem[]> = {};
      for (const { householdId, expiring, expired } of results) {
        nextExpiring[householdId] = expiring;
        nextExpired[householdId] = expired;
      }
      setExpiryAlertsByHousehold(nextExpiring);
      setExpiredAlertsByHousehold(nextExpired);
    },
    [dataMode, port],
  );

  // ── 거점 목록 로드 ──
  const 거점_목록을_불러온다 = useCallback(() => {
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const list = await port.list();
        const defs = kindDefsRef.current;
        setHouseholdsState(normalizeHouseholdKinds(list, defs));
        void 거점_유통기한_임박_만료_를_로드_한다(list);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "거점 목록을 불러오는 중 오류가 발생했습니다.",
        );
      } finally {
        setLoading(false);
        setHydrated(true);
      }
    })();
  }, [port, 거점_유통기한_임박_만료_를_로드_한다]);

  useEffect(() => {
    거점_목록을_불러온다();
  }, [거점_목록을_불러온다]);

  // ── 거점 유형 교체 ──
  const 거점_유형_정의를_교체_한다 = useCallback(
    async (next: HouseholdKindDefinition[]) => {
      const cleaned = next
        .map((d, i) => ({
          id: d.id.trim(),
          label: d.label.trim(),
          sortOrder: d.sortOrder ?? i,
        }))
        .filter((d) => d.id && d.label);
      const sorted = sortHouseholdKindDefinitions(cleaned);
      if (sorted.length === 0) return;

      const valid = new Set(sorted.map((d) => d.id));
      const fallback = sorted[0]!.id;
      setHouseholdsState((prev) =>
        prev.map((h) => ({
          ...h,
          kind: valid.has(h.kind) ? h.kind : fallback,
        })),
      );
      setHouseholdKindDefinitions(sorted);

      try {
        await port.saveKinds(sorted);
      } catch (err) {
        console.error("거점 유형 저장 오류:", err);
      }
    },
    [port],
  );

  // ── 거점 추가 ──
  const 거점을_추가_한다 = useCallback(
    async (name: string, kind: string): Promise<string> => {
      const defs = kindDefsRef.current;
      const valid = new Set(defs.map((d) => d.id));
      const resolved = valid.has(kind) ? kind : (defs[0]?.id ?? "home");
      try {
        const created = await port.create(name, resolved);
        setHouseholdsState((prev) => [...prev, ensureHouseholdShape(created)]);
        return created.id;
      } catch (err) {
        console.error("거점 추가 오류:", err);
        // fallback: 로컬에서만 추가
        const id = newEntityId();
        const h: Household = {
          id,
          name: name.trim() || "이름 없는 거점",
          kind: resolved,
          rooms: [],
          items: [],
          furniturePlacements: [],
          storageLocations: [],
          createdAt: new Date().toISOString(),
          catalog: cloneDefaultCatalog(),
        };
        setHouseholdsState((prev) => [...prev, h]);
        return id;
      }
    },
    [port],
  );

  // ── 거점 기본정보 수정 ──
  const 거점_기본정보를_수정_한다 = useCallback(
    async (id: string, name: string, kind: string) => {
      setHouseholdsState((prev) =>
        prev.map((h) => (h.id === id ? { ...h, name, kind } : h)),
      );
      try {
        await port.update(id, { name, kind });
      } catch (err) {
        console.error("거점 수정 오류:", err);
      }
    },
    [port],
  );

  // ── 거점 삭제 ──
  const 거점을_삭제_한다 = useCallback(
    async (householdId: string) => {
      setHouseholdsState((prev) => prev.filter((h) => h.id !== householdId));
      try {
        await port.remove(householdId);
      } catch (err) {
        console.error("거점 삭제 오류:", err);
        거점_목록을_불러온다();
      }
    },
    [port, 거점_목록을_불러온다],
  );

  // ── 거점 상태 직접 갱신 (rooms/items/catalog 등 로컬 전용) ──
  const 거점을_갱신_한다 = useCallback(
    (householdId: string, updater: (h: Household) => Household) => {
      setHouseholdsState((prev) =>
        prev.map((h) => (h.id === householdId ? updater(h) : h)),
      );
    },
    [],
  );

  // ── 방 목록 동기화 ──
  const 방_목록을_동기화_한다 = useCallback(
    async (
      householdId: string,
      rooms: StructureRoom[],
      layout?: HouseholdStructureDiagramLayout,
    ): Promise<StructureRoom[]> => {
      // 낙관적 로컬 업데이트 (temp ID 기반)
      거점을_갱신_한다(householdId, (h) => ({
        ...h,
        rooms,
        ...(layout !== undefined ? { structureDiagramLayout: layout } : {}),
      }));
      // 방 동기화 → 서버 UUID 반환
      const serverRooms = await port.syncRooms(householdId, rooms);
      // house-structure는 서버 UUID를 키로 저장해야 다음 조회 시 좌표가 매핑됨
      const resolvedLayout =
        layout ??
        householdsRef.current.find((h) => h.id === householdId)
          ?.structureDiagramLayout;
      await port.saveHouseStructure(householdId, serverRooms, resolvedLayout);
      // 로컬 상태를 서버 UUID로 갱신
      if (serverRooms.length > 0) {
        거점을_갱신_한다(householdId, (h) => ({
          ...h,
          rooms: serverRooms,
        }));
      }
      return serverRooms;
    },
    [거점을_갱신_한다, port],
  );

  // ── 가구 배치 추가 ──
  const 가구를_추가_한다 = useCallback(
    async (
      householdId: string,
      roomId: string,
      label: string,
      anchorDirectStorageId?: string | null,
      sortOrder?: number,
    ): Promise<FurniturePlacement | null> => {
      try {
        const fp = await port.createFurniturePlacement(
          householdId,
          roomId,
          label,
          anchorDirectStorageId,
          sortOrder,
        );
        거점을_갱신_한다(householdId, (h) => ({
          ...h,
          furniturePlacements: [...(h.furniturePlacements ?? []), fp],
        }));
        return fp;
      } catch (e) {
        console.error("가구 배치 생성 오류:", e);
        return null;
      }
    },
    [거점을_갱신_한다, port],
  );

  // ── 가구 앵커 변경 ──
  const 가구_앵커를_변경_한다 = useCallback(
    async (
      householdId: string,
      furnitureId: string,
      newSlotId: string | null,
    ): Promise<void> => {
      거점을_갱신_한다(householdId, (h) => ({
        ...h,
        furniturePlacements: (h.furniturePlacements ?? []).map((f) =>
          f.id === furnitureId
            ? { ...f, anchorDirectStorageId: newSlotId ?? undefined }
            : f,
        ),
      }));
      await port
        .patchFurniturePlacement(householdId, furnitureId, {
          anchorDirectStorageId: newSlotId,
        })
        .catch((e) => console.error("가구 앵커 변경 오류:", e));
    },
    [거점을_갱신_한다, port],
  );

  // ── 가구 배치 삭제 ──
  const 가구를_삭제_한다 = useCallback(
    async (householdId: string, furnitureId: string): Promise<void> => {
      const h = householdsRef.current.find((x) => x.id === householdId);
      const slotIds = new Set(
        (h?.storageLocations ?? [])
          .filter((s) => s.furniturePlacementId === furnitureId)
          .map((s) => s.id),
      );
      거점을_갱신_한다(householdId, (cur) => ({
        ...cur,
        furniturePlacements: (cur.furniturePlacements ?? []).filter(
          (f) => f.id !== furnitureId,
        ),
        storageLocations: (cur.storageLocations ?? []).filter(
          (s) => s.furniturePlacementId !== furnitureId,
        ),
        items: cur.items.filter(
          (i) => !i.storageLocationId || !slotIds.has(i.storageLocationId),
        ),
      }));
      await port
        .removeFurniturePlacement(householdId, furnitureId)
        .catch((e) => console.error("가구 배치 삭제 오류:", e));
    },
    [거점을_갱신_한다, port],
  );

  // ── 보관 장소 추가 ──
  const 보관장소를_추가_한다 = useCallback(
    async (
      householdId: string,
      data: {
        name: string;
        roomId?: string | null;
        furniturePlacementId?: string | null;
        sortOrder?: number;
      },
    ): Promise<StorageLocationRow | null> => {
      try {
        const slot = await port.createStorageLocation(householdId, data);
        거점을_갱신_한다(householdId, (h) => ({
          ...h,
          storageLocations: [...(h.storageLocations ?? []), slot],
        }));
        return slot;
      } catch (e) {
        console.error("보관 장소 생성 오류:", e);
        return null;
      }
    },
    [거점을_갱신_한다, port],
  );

  // ── 보관 장소 이름 수정 ──
  const 보관장소_이름을_수정_한다 = useCallback(
    async (householdId: string, slotId: string, name: string): Promise<void> => {
      거점을_갱신_한다(householdId, (h) => ({
        ...h,
        storageLocations: (h.storageLocations ?? []).map((s) =>
          s.id === slotId ? { ...s, name } : s,
        ),
      }));
      await port
        .updateStorageLocation(householdId, slotId, name)
        .catch((e) => console.error("보관 장소 이름 수정 오류:", e));
    },
    [거점을_갱신_한다, port],
  );

  // ── 보관 장소 삭제 (앵커 폴백 포함) ──
  const 보관장소를_삭제_한다 = useCallback(
    async (householdId: string, slotId: string): Promise<void> => {
      const h = householdsRef.current.find((x) => x.id === householdId);
      if (!h) return;
      const slot = (h.storageLocations ?? []).find((s) => s.id === slotId);
      if (!slot) return;

      const isRoomDirect =
        Boolean(slot.roomId) &&
        (slot.furniturePlacementId == null || slot.furniturePlacementId === "");

      let anchored: FurniturePlacement[] = [];
      let fallback: string | undefined;

      if (isRoomDirect && slot.roomId) {
        const roomDirects = (h.storageLocations ?? [])
          .filter(
            (s) =>
              s.roomId === slot.roomId &&
              (s.furniturePlacementId == null || s.furniturePlacementId === ""),
          )
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        fallback = roomDirects.find((s) => s.id !== slotId)?.id;
        anchored = (h.furniturePlacements ?? []).filter(
          (fp) => fp.anchorDirectStorageId === slotId,
        );
      }

      // 로컬 상태 갱신 (앵커 폴백 + 슬롯 제거 + 아이템 정리)
      거점을_갱신_한다(householdId, (cur) => {
        let nextFps = [...(cur.furniturePlacements ?? [])];
        if (isRoomDirect && anchored.length > 0) {
          nextFps = nextFps.map((f) =>
            f.anchorDirectStorageId === slotId
              ? { ...f, anchorDirectStorageId: fallback }
              : f,
          );
        }
        return {
          ...cur,
          storageLocations: (cur.storageLocations ?? []).filter(
            (s) => s.id !== slotId,
          ),
          furniturePlacements: nextFps,
          items: cur.items.filter((i) => i.storageLocationId !== slotId),
        };
      });

      // API: 영향받는 가구 앵커 변경
      for (const fp of anchored) {
        await port
          .patchFurniturePlacement(householdId, fp.id, {
            anchorDirectStorageId: fallback ?? null,
          })
          .catch((e) => console.error("가구 앵커 변경 오류:", e));
      }
      // API: 보관 장소 삭제
      await port
        .removeStorageLocation(householdId, slotId)
        .catch((e) => console.error("보관 장소 삭제 오류:", e));
    },
    [거점을_갱신_한다, port],
  );

  // ── 집 구조 레이아웃 저장 ──
  const 집_구조를_저장_한다 = useCallback(
    async (
      householdId: string,
      layout: HouseholdStructureDiagramLayout,
      rooms?: StructureRoom[],
    ) => {
      거점을_갱신_한다(householdId, (h) => ({
        ...h,
        ...(rooms !== undefined ? { rooms } : {}),
        structureDiagramLayout: layout,
      }));
      // rooms가 명시적으로 전달된 경우 해당 값을 사용한다.
      // 그렇지 않으면 ref에서 읽는다 (방 좌표 변경이 없는 경우라 이전 값이 올바름).
      const resolvedRooms =
        rooms ?? householdsRef.current.find((h) => h.id === householdId)?.rooms ?? [];
      await port.saveHouseStructure(householdId, resolvedRooms, layout);
    },
    [거점을_갱신_한다, port],
  );

  // ── 멤버 역할 변경 ──
  const 멤버_역할을_변경_한다 = useCallback(
    async (householdId: string, memberId: string, role: MemberRole) => {
      setHouseholdsState((prev) =>
        prev.map((h) =>
          h.id === householdId
            ? {
                ...h,
                members: (h.members ?? []).map((m) =>
                  m.id === memberId ? { ...m, role } : m,
                ),
              }
            : h,
        ),
      );
      try {
        await port.changeMemberRole(householdId, memberId, role);
      } catch (err) {
        console.error("멤버 역할 변경 오류:", err);
        거점_목록을_불러온다();
        throw err;
      }
    },
    [port, 거점_목록을_불러온다],
  );

  // ── 멤버 제거 ──
  const 멤버를_제거_한다 = useCallback(
    async (householdId: string, memberId: string) => {
      setHouseholdsState((prev) =>
        prev.map((h) =>
          h.id === householdId
            ? {
                ...h,
                members: (h.members ?? []).filter((m) => m.id !== memberId),
              }
            : h,
        ),
      );
      try {
        await port.removeMember(householdId, memberId);
      } catch (err) {
        console.error("멤버 제거 오류:", err);
        거점_목록을_불러온다();
        throw err;
      }
    },
    [port, 거점_목록을_불러온다],
  );

  // ── 초대 생성 ──
  const 초대를_생성_한다 = useCallback(
    (householdId: string, params: CreateInvitationParams) =>
      port.createInvitation(householdId, params),
    [port],
  );

  // ── 초대 목록 ──
  const 초대_목록을_불러온다 = useCallback(
    (householdId: string) => port.listInvitations(householdId),
    [port],
  );

  // ── 초대 취소 ──
  const 초대를_취소_한다 = useCallback(
    (householdId: string, invitationId: string) =>
      port.revokeInvitation(householdId, invitationId),
    [port],
  );

  // ── 카탈로그 ──
  const 거점_카탈로그를_가져온다 = useCallback(
    (householdId: string): ProductCatalog => {
      const h = householdsRef.current.find((x) => x.id === householdId);
      return h?.catalog ?? cloneDefaultCatalog();
    },
    [],
  );

  const 카탈로그를_갱신_한다 = useCallback(
    (householdId: string, updater: (c: ProductCatalog) => ProductCatalog) => {
      let before: ProductCatalog | null = null;
      let after: ProductCatalog | null = null;

      거점을_갱신_한다(householdId, (h) => {
        before = structuredClone(h.catalog ?? cloneDefaultCatalog());
        after = updater(structuredClone(h.catalog ?? cloneDefaultCatalog()));
        return { ...h, catalog: after };
      });

      if (before && after) {
        void port.syncCatalogDiff(householdId, before, after);
      }
    },
    [거점을_갱신_한다, port],
  );

  // ── 재고 기록 ──
  const 재고_소비를_기록_한다 = useCallback(
    (householdId: string, itemId: string, quantity: number, memo?: string) => {
      if (!Number.isFinite(quantity) || quantity < 1) return false;
      const h = householdsRef.current.find((x) => x.id === householdId);
      if (!h) return false;
      const it = h.items.find((i) => i.id === itemId);
      if (!it || it.quantity < quantity) return false;
      const nextQty = it.quantity - quantity;
      appendInventoryLedgerRow({
        id: crypto.randomUUID(),
        householdId,
        inventoryItemId: itemId,
        type: "out",
        quantityDelta: -quantity,
        quantityAfter: nextQty,
        itemLabel: it.name,
        memo: memo?.trim() || undefined,
        createdAt: new Date().toISOString(),
      });
      거점을_갱신_한다(householdId, (prev) => ({
        ...prev,
        items: prev.items.map((row) =>
          row.id === itemId ? { ...row, quantity: nextQty } : row,
        ),
      }));

      void port
        .recordInventoryConsumption(householdId, itemId, quantity, memo)
        .catch((e) => console.error("소비 기록 포트 오류:", e));

      return true;
    },
    [거점을_갱신_한다, port],
  );

  const 재고_폐기를_기록_한다 = useCallback(
    (
      householdId: string,
      itemId: string,
      quantity: number,
      reasonCode: string,
      memo?: string,
    ) => {
      if (!Number.isFinite(quantity) || quantity < 1) return false;
      const h = householdsRef.current.find((x) => x.id === householdId);
      if (!h) return false;
      const it = h.items.find((i) => i.id === itemId);
      if (!it || it.quantity < quantity) return false;
      const nextQty = it.quantity - quantity;
      appendInventoryLedgerRow({
        id: crypto.randomUUID(),
        householdId,
        inventoryItemId: itemId,
        type: "waste",
        quantityDelta: -quantity,
        quantityAfter: nextQty,
        itemLabel: it.name,
        reason: reasonCode,
        memo: memo?.trim() || undefined,
        createdAt: new Date().toISOString(),
      });
      거점을_갱신_한다(householdId, (prev) => ({
        ...prev,
        items: prev.items.map((row) =>
          row.id === itemId ? { ...row, quantity: nextQty } : row,
        ),
      }));

      void port
        .recordInventoryWaste(householdId, itemId, quantity, reasonCode, memo)
        .catch((e) => console.error("폐기 기록 포트 오류:", e));

      return true;
    },
    [거점을_갱신_한다, port],
  );

  const 재고_장보기_보충을_기록_한다 = useCallback(
    (
      householdId: string,
      itemId: string,
      quantity: number,
      memo?: string,
      refId?: string,
    ) => {
      if (!Number.isFinite(quantity) || quantity < 1) return false;
      const h = householdsRef.current.find((x) => x.id === householdId);
      if (!h) return false;
      const it = h.items.find((i) => i.id === itemId);
      if (!it) return false;
      const nextQty = it.quantity + quantity;
      appendInventoryLedgerRow({
        id: crypto.randomUUID(),
        householdId,
        inventoryItemId: itemId,
        type: "in",
        quantityDelta: quantity,
        quantityAfter: nextQty,
        itemLabel: it.name,
        memo: memo?.trim() || "장보기 구매 완료",
        refType: "shopping",
        refId: refId?.trim() || undefined,
        createdAt: new Date().toISOString(),
      });
      거점을_갱신_한다(householdId, (prev) => ({
        ...prev,
        items: prev.items.map((row) =>
          row.id === itemId ? { ...row, quantity: nextQty } : row,
        ),
      }));
      return true;
    },
    [거점을_갱신_한다],
  );

  const 재고_품목을_등록_한다 = useCallback(
    async (householdId: string, row: InventoryRow): Promise<InventoryRow | null> => {
      try {
        const result = await port.createInventoryItem(householdId, {
          productVariantId: row.productVariantId ?? "",
          storageLocationId: row.storageLocationId ?? "",
          quantity: row.quantity,
          minStockLevel: row.minStockLevel,
        });
        const finalRow: InventoryRow = { ...row, id: result.id };
        거점을_갱신_한다(householdId, (h) => ({
          ...h,
          items: [...h.items, finalRow],
        }));
        return finalRow;
      } catch (e) {
        console.error("재고 품목 등록 오류:", e);
        return null;
      }
    },
    [거점을_갱신_한다, port],
  );

  const 구매에_재고를_연결_한다 = useCallback(
    async (
      householdId: string,
      purchaseId: string,
      inventoryItemId: string,
    ): Promise<void> => {
      await port
        .linkPurchaseToInventoryItem(householdId, purchaseId, inventoryItemId)
        .catch((e) => console.error("구매-재고 연결 오류:", e));
    },
    [port],
  );

  const 재고_수량을_수동_조정_한다 = useCallback(
    (
      householdId: string,
      itemId: string,
      quantityDelta: number,
      memo?: string,
    ): boolean => {
      if (!Number.isFinite(quantityDelta) || quantityDelta === 0) return false;
      const h = householdsRef.current.find((x) => x.id === householdId);
      if (!h) return false;
      const it = h.items.find((i) => i.id === itemId);
      if (!it) return false;
      const nextQty = Math.max(0, it.quantity + quantityDelta);
      appendInventoryLedgerRow({
        id: crypto.randomUUID(),
        householdId,
        inventoryItemId: itemId,
        type: "adjust",
        quantityDelta,
        quantityAfter: nextQty,
        itemLabel: it.name,
        memo: memo?.trim() || undefined,
        createdAt: new Date().toISOString(),
      });
      거점을_갱신_한다(householdId, (prev) => ({
        ...prev,
        items: prev.items.map((row) =>
          row.id === itemId ? { ...row, quantity: nextQty } : row,
        ),
      }));
      void port
        .recordInventoryAdjustment(householdId, itemId, quantityDelta, memo)
        .catch((e) => console.error("수동 조정 API 오류:", e));
      return true;
    },
    [거점을_갱신_한다, port],
  );

  const 재고_수량을_직접_설정_한다 = useCallback(
    (
      householdId: string,
      itemId: string,
      newQuantity: number,
      memo?: string,
    ): boolean => {
      if (!Number.isFinite(newQuantity) || newQuantity < 0) return false;
      const h = householdsRef.current.find((x) => x.id === householdId);
      if (!h) return false;
      const it = h.items.find((i) => i.id === itemId);
      if (!it) return false;
      const quantityDelta = newQuantity - it.quantity;
      if (quantityDelta === 0) return true;
      appendInventoryLedgerRow({
        id: crypto.randomUUID(),
        householdId,
        inventoryItemId: itemId,
        type: "adjust",
        quantityDelta,
        quantityAfter: newQuantity,
        itemLabel: it.name,
        memo: memo?.trim() || undefined,
        createdAt: new Date().toISOString(),
      });
      거점을_갱신_한다(householdId, (prev) => ({
        ...prev,
        items: prev.items.map((row) =>
          row.id === itemId ? { ...row, quantity: newQuantity } : row,
        ),
      }));
      void port
        .updateInventoryItemQuantity(householdId, itemId, newQuantity)
        .catch((e) => console.error("수량 직접 설정 API 오류:", e));
      return true;
    },
    [거점을_갱신_한다, port],
  );

  const 거점_유통기한_임박_목록을_가져온다 = useCallback(
    (householdId: string): ExpiryAlertItem[] =>
      expiryAlertsByHousehold[householdId] ?? [],
    [expiryAlertsByHousehold],
  );

  const 거점_만료_목록을_가져온다 = useCallback(
    (householdId: string): ExpiryAlertItem[] =>
      expiredAlertsByHousehold[householdId] ?? [],
    [expiredAlertsByHousehold],
  );

  const value = useMemo<DashboardContextType>(
    () => ({
      dataMode,
      households,
      거점_카탈로그를_가져온다,
      householdKindDefinitions,
      householdKindsHydrated,
      loading,
      error,
      거점_목록을_불러온다,
      거점을_추가_한다,
      거점_기본정보를_수정_한다,
      거점을_삭제_한다,
      거점을_갱신_한다,
      거점_유형_정의를_교체_한다,
      카탈로그를_갱신_한다,
      방_목록을_동기화_한다,
      집_구조를_저장_한다,
      가구를_추가_한다,
      가구_앵커를_변경_한다,
      가구를_삭제_한다,
      보관장소를_추가_한다,
      보관장소_이름을_수정_한다,
      보관장소를_삭제_한다,
      멤버_역할을_변경_한다,
      멤버를_제거_한다,
      초대를_생성_한다,
      초대_목록을_불러온다,
      초대를_취소_한다,
      재고_소비를_기록_한다,
      재고_폐기를_기록_한다,
      재고_장보기_보충을_기록_한다,
      재고_품목을_등록_한다,
      구매에_재고를_연결_한다,
      재고_수량을_수동_조정_한다,
      재고_수량을_직접_설정_한다,
      거점_유통기한_임박_목록을_가져온다,
      거점_만료_목록을_가져온다,
    }),
    [
      dataMode,
      households,
      거점_카탈로그를_가져온다,
      householdKindDefinitions,
      householdKindsHydrated,
      loading,
      error,
      거점_목록을_불러온다,
      거점을_추가_한다,
      거점_기본정보를_수정_한다,
      거점을_삭제_한다,
      거점을_갱신_한다,
      거점_유형_정의를_교체_한다,
      카탈로그를_갱신_한다,
      방_목록을_동기화_한다,
      집_구조를_저장_한다,
      가구를_추가_한다,
      가구_앵커를_변경_한다,
      가구를_삭제_한다,
      보관장소를_추가_한다,
      보관장소_이름을_수정_한다,
      보관장소를_삭제_한다,
      멤버_역할을_변경_한다,
      멤버를_제거_한다,
      초대를_생성_한다,
      초대_목록을_불러온다,
      초대를_취소_한다,
      재고_소비를_기록_한다,
      재고_폐기를_기록_한다,
      재고_장보기_보충을_기록_한다,
      재고_품목을_등록_한다,
      구매에_재고를_연결_한다,
      재고_수량을_수동_조정_한다,
      재고_수량을_직접_설정_한다,
      거점_유통기한_임박_목록을_가져온다,
      거점_만료_목록을_가져온다,
    ],
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

/** current 경로 전용 Provider. API 서비스를 주입한다. */
export function CurrentDashboardProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <DashboardProvider port={dashboardApiHouseholdsClient} dataMode="api">
      {children}
    </DashboardProvider>
  );
}
