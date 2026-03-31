import {
  getHouseholds,
  getSharedHouseholdKindDefinitions,
  setHouseholds,
  setPurchases,
  setSharedHouseholdKindDefinitions,
} from "@/lib/local-store";
import { cloneDefaultHouseholdKindDefinitions } from "@/lib/household-kind-defaults";
import { inventoryDisplayLine } from "@/lib/product-catalog-helpers";
import type {
  CatalogCategory,
  CatalogProduct,
  CatalogProductVariant,
  CatalogUnit,
  FurniturePlacement,
  GroupMember,
  Household,
  HouseholdKindDefinition,
  HouseholdStructureDiagramLayout,
  InventoryRow,
  MemberRole,
  MockInvitation,
  ProductCatalog,
  PurchaseBatchLot,
  PurchaseRecord,
  StorageLocationRow,
  StructureRoom,
} from "@/types/domain";

/* ─────────────────── 카탈로그 diff 유틸 ─────────────────── */

async function syncCatalogDiffImpl(
  householdId: string,
  before: ProductCatalog,
  after: ProductCatalog,
): Promise<void> {
  const jsonFetch = (url: string, method: string, body?: unknown) =>
    apiFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).catch((e) => console.error(`카탈로그 API 오류 [${method} ${url}]:`, e));

  const base = `/api/households/${householdId}`;

  const beforeCats = new Map(before.categories.map((c) => [c.id, c]));
  const afterCats = new Map(after.categories.map((c) => [c.id, c]));
  for (const [id, cat] of afterCats) {
    if (!beforeCats.has(id)) {
      await jsonFetch(`${base}/categories`, "POST", {
        name: cat.name,
        sortOrder: cat.sortOrder,
      });
    } else if (JSON.stringify(beforeCats.get(id)) !== JSON.stringify(cat)) {
      await jsonFetch(`${base}/categories/${id}`, "PUT", {
        name: cat.name,
        sortOrder: cat.sortOrder,
      });
    }
  }
  for (const [id] of beforeCats) {
    if (!afterCats.has(id))
      await jsonFetch(`${base}/categories/${id}`, "DELETE");
  }

  const beforeUnits = new Map(before.units.map((u) => [u.id, u]));
  const afterUnits = new Map(after.units.map((u) => [u.id, u]));
  for (const [id, unit] of afterUnits) {
    if (!beforeUnits.has(id)) {
      await jsonFetch(`${base}/units`, "POST", {
        symbol: unit.symbol,
        name: unit.name,
        sortOrder: unit.sortOrder,
      });
    } else if (JSON.stringify(beforeUnits.get(id)) !== JSON.stringify(unit)) {
      await jsonFetch(`${base}/units/${id}`, "PUT", {
        symbol: unit.symbol,
        name: unit.name,
        sortOrder: unit.sortOrder,
      });
    }
  }
  for (const [id] of beforeUnits) {
    if (!afterUnits.has(id)) await jsonFetch(`${base}/units/${id}`, "DELETE");
  }

  const beforeProds = new Map(before.products.map((p) => [p.id, p]));
  const afterProds = new Map(after.products.map((p) => [p.id, p]));
  for (const [id, prod] of afterProds) {
    if (!beforeProds.has(id)) {
      await jsonFetch(`${base}/products`, "POST", {
        categoryId: prod.categoryId,
        name: prod.name,
        isConsumable: prod.isConsumable,
        imageUrl: prod.imageUrl,
        description: prod.description,
      });
    } else if (JSON.stringify(beforeProds.get(id)) !== JSON.stringify(prod)) {
      await jsonFetch(`${base}/products/${id}`, "PUT", {
        categoryId: prod.categoryId,
        name: prod.name,
        isConsumable: prod.isConsumable,
        imageUrl: prod.imageUrl,
        description: prod.description,
      });
    }
  }
  for (const [id] of beforeProds) {
    if (!afterProds.has(id))
      await jsonFetch(`${base}/products/${id}`, "DELETE");
  }

  const beforeVars = new Map(before.variants.map((v) => [v.id, v]));
  const afterVars = new Map(after.variants.map((v) => [v.id, v]));
  for (const [id, variant] of afterVars) {
    if (!beforeVars.has(id)) {
      await jsonFetch(
        `${base}/products/${variant.productId}/variants`,
        "POST",
        {
          unitId: variant.unitId,
          quantityPerUnit: variant.quantityPerUnit,
          name: variant.name,
          price: variant.price,
          sku: variant.sku,
          isDefault: variant.isDefault,
        },
      );
    } else if (JSON.stringify(beforeVars.get(id)) !== JSON.stringify(variant)) {
      await jsonFetch(
        `${base}/products/${variant.productId}/variants/${id}`,
        "PUT",
        {
          unitId: variant.unitId,
          quantityPerUnit: variant.quantityPerUnit,
          name: variant.name,
          price: variant.price,
          sku: variant.sku,
          isDefault: variant.isDefault,
        },
      );
    }
  }
  for (const [id, variant] of beforeVars) {
    if (!afterVars.has(id)) {
      await jsonFetch(
        `${base}/products/${variant.productId}/variants/${id}`,
        "DELETE",
      );
    }
  }
}
import type { DashboardHouseholdsPort } from "./dashboard-households.port";
import { cloneDefaultCatalog } from "@/app/(mock)/mock/dashboard/_context/dashboard-mock.service";
import { ensureHouseholdShape } from "@/lib/household-location";

/* ─────────────────────────────────────────────────────── helpers ── */

async function apiFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const json = await res.json();
  if (!json.success) throw new Error(json.message ?? "API 오류");
  return json.data as T;
}

/** 백엔드 HouseholdKindDefinition → 프론트 HouseholdKindDefinition */
function mapKind(raw: {
  kindId: string;
  label: string;
  sortOrder: number;
}): HouseholdKindDefinition {
  return { id: raw.kindId, label: raw.label, sortOrder: raw.sortOrder };
}

/** 백엔드 Household → 프론트 Household (rooms/items/catalog는 localStorage 오버레이) */
function mergeWithLocal(
  remote: { id: string; name: string; kind: string | null; createdAt: string },
  local: Household | undefined,
): Household {
  const base = ensureHouseholdShape(
    local ?? {
      id: remote.id,
      name: remote.name,
      kind: remote.kind ?? "home",
      rooms: [],
      items: [],
      furniturePlacements: [],
      storageLocations: [],
      createdAt: remote.createdAt,
      catalog: cloneDefaultCatalog(),
    },
  );
  return {
    ...base,
    name: remote.name,
    kind: remote.kind ?? base.kind,
  };
}

/** 백엔드 멤버 → GroupMember */
function mapMember(raw: {
  id: string;
  email: string;
  displayName: string;
  role: string;
}): GroupMember {
  return {
    id: raw.id,
    email: raw.email,
    role: raw.role as MemberRole,
    label: raw.displayName || undefined,
  };
}

/** 백엔드 Invitation → MockInvitation */
function mapInvitation(raw: {
  id: string;
  householdId: string;
  role: string;
  token: string;
  createdAt: string;
}): MockInvitation {
  return {
    id: raw.id,
    householdId: raw.householdId,
    role: raw.role as MemberRole,
    token: raw.token,
    createdAt: raw.createdAt,
  };
}

/* ── 구매·로트 로드 (대시보드 재고 섹션용 localStorage 동기화) ── */

interface ApiPurchaseRaw {
  id: string;
  householdId: string;
  inventoryItemId: string | null;
  unitPrice: number;
  purchasedAt: string;
  supplierName: string | null;
  itemName: string | null;
  variantCaption: string | null;
  unitSymbol: string | null;
}

interface ApiPurchaseBatchRaw {
  id: string;
  purchaseId: string;
  quantity: number;
  expirationDate: string | null;
}

function mapApiToPurchaseRecord(
  p: ApiPurchaseRaw,
  batches: ApiPurchaseBatchRaw[],
): PurchaseRecord {
  const myBatches = batches.filter((b) => b.purchaseId === p.id);
  const totalQty = myBatches.reduce((s, b) => s + b.quantity, 0);
  return {
    id: p.id,
    householdId: p.householdId,
    inventoryItemId: p.inventoryItemId ?? undefined,
    itemName: p.itemName ?? "",
    variantCaption: p.variantCaption ?? undefined,
    unitSymbol: p.unitSymbol ?? "",
    purchasedOn: p.purchasedAt.slice(0, 10),
    unitPrice: p.unitPrice,
    totalPrice: p.unitPrice * (totalQty || 1),
    supplierName: p.supplierName ?? undefined,
    batches: myBatches.map(
      (b): PurchaseBatchLot => ({
        id: b.id,
        quantity: b.quantity,
        expiresOn: b.expirationDate?.slice(0, 10) ?? "",
      }),
    ),
  };
}

async function loadPurchasesForHousehold(
  householdId: string,
): Promise<PurchaseRecord[]> {
  try {
    const [purchases, batches] = await Promise.all([
      apiFetch<ApiPurchaseRaw[]>(`/api/households/${householdId}/purchases`),
      apiFetch<ApiPurchaseBatchRaw[]>(`/api/households/${householdId}/batches`),
    ]);
    return purchases.map((p) => mapApiToPurchaseRecord(p, batches));
  } catch {
    return [];
  }
}

/* ── 재고 품목 로드 및 매핑 ── */

async function loadInventoryItemsFromApi(
  householdId: string,
  catalog: ProductCatalog,
  storageLocations: StorageLocationRow[],
  furniturePlacements: FurniturePlacement[],
): Promise<InventoryRow[]> {
  const raw = await apiFetch<
    Array<{
      id: string;
      householdId: string;
      productVariantId: string;
      storageLocationId: string;
      quantity: number;
      minStockLevel: number | null;
    }>
  >(`/api/households/${householdId}/inventory-items`).catch(() => []);

  const slotById = new Map(storageLocations.map((s) => [s.id, s]));
  const fpById = new Map(furniturePlacements.map((fp) => [fp.id, fp]));
  const variantById = new Map(catalog.variants.map((v) => [v.id, v]));
  const productById = new Map(catalog.products.map((p) => [p.id, p]));
  const unitById = new Map(catalog.units.map((u) => [u.id, u]));

  return raw.map((item) => {
    const variant = variantById.get(item.productVariantId);
    const product = variant ? productById.get(variant.productId) : undefined;
    const unit = variant ? unitById.get(variant.unitId) : undefined;
    const slot = slotById.get(item.storageLocationId);

    // roomId 결정: 방 직속 슬롯이면 slot.roomId, 가구 하위 슬롯이면 furniture.roomId
    let roomId = slot?.roomId ?? "";
    if (!roomId && slot?.furniturePlacementId) {
      roomId = fpById.get(slot.furniturePlacementId)?.roomId ?? "";
    }

    const variantCaption =
      variant?.name ??
      (variant && unit ? `${variant.quantityPerUnit}${unit.symbol}` : undefined);

    const row: InventoryRow = {
      id: item.id,
      name: "",
      quantity: item.quantity,
      unit: unit?.symbol ?? "",
      roomId,
      storageLocationId: item.storageLocationId,
      categoryId: product?.categoryId,
      productId: product?.id,
      productVariantId: item.productVariantId,
      variantCaption,
      quantityPerUnit: variant?.quantityPerUnit,
      minStockLevel: item.minStockLevel ?? undefined,
    };

    row.name =
      product && variant && unit
        ? inventoryDisplayLine(catalog, row)
        : (product?.name ?? "알 수 없는 품목");

    return row;
  });
}

/** 거점 카탈로그를 API에서 일괄 로드 */
async function loadCatalogFromApi(
  householdId: string,
): Promise<ProductCatalog> {
  const [rawCategories, rawUnits, rawProducts] = await Promise.all([
    apiFetch<Array<{ id: string; name: string; sortOrder: number }>>(
      `/api/households/${householdId}/categories`,
    ).catch(() => [] as Array<{ id: string; name: string; sortOrder: number }>),
    apiFetch<
      Array<{
        id: string;
        symbol: string;
        name: string | null;
        sortOrder: number;
      }>
    >(`/api/households/${householdId}/units`).catch(
      () =>
        [] as Array<{
          id: string;
          symbol: string;
          name: string | null;
          sortOrder: number;
        }>,
    ),
    apiFetch<
      Array<{
        id: string;
        categoryId: string;
        name: string;
        isConsumable: boolean;
        imageUrl: string | null;
        description: string | null;
      }>
    >(`/api/households/${householdId}/products`).catch(
      () =>
        [] as Array<{
          id: string;
          categoryId: string;
          name: string;
          isConsumable: boolean;
          imageUrl: string | null;
          description: string | null;
        }>,
    ),
  ]);

  const categories: CatalogCategory[] = rawCategories.map((c) => ({
    id: c.id,
    name: c.name,
    sortOrder: c.sortOrder,
  }));

  const units: CatalogUnit[] = rawUnits.map((u) => ({
    id: u.id,
    symbol: u.symbol,
    name: u.name ?? undefined,
    sortOrder: u.sortOrder,
  }));

  const products: CatalogProduct[] = rawProducts.map((p) => ({
    id: p.id,
    categoryId: p.categoryId,
    name: p.name,
    isConsumable: p.isConsumable,
    imageUrl: p.imageUrl ?? undefined,
    description: p.description ?? undefined,
  }));

  // 상품 변형 — 상품별로 병렬 로드
  const variantArrays = await Promise.all(
    rawProducts.map((p) =>
      apiFetch<
        Array<{
          id: string;
          productId?: string;
          unitId: string;
          quantityPerUnit: number;
          name: string | null;
          price: number | null;
          sku: string | null;
          isDefault: boolean;
        }>
      >(`/api/households/${householdId}/products/${p.id}/variants`).catch(
        () => [],
      ),
    ),
  );

  const variants: CatalogProductVariant[] = variantArrays.flatMap((arr, i) =>
    arr.map((v) => ({
      id: v.id,
      productId: rawProducts[i]!.id,
      unitId: v.unitId,
      quantityPerUnit: v.quantityPerUnit,
      name: v.name ?? undefined,
      price: v.price ?? undefined,
      sku: v.sku ?? undefined,
      isDefault: v.isDefault,
    })),
  );

  return { categories, units, products, variants };
}

/** 거점 보관장소를 API에서 로드 */
async function loadStorageLocationsFromApi(
  householdId: string,
): Promise<StorageLocationRow[]> {
  const raw = await apiFetch<
    Array<{
      id: string;
      name: string;
      roomId: string | null;
      furniturePlacementId: string | null;
      sortOrder: number;
    }>
  >(`/api/households/${householdId}/storage-locations`).catch(() => []);
  return raw.map((s) => ({
    id: s.id,
    name: s.name,
    roomId: s.roomId,
    furniturePlacementId: s.furniturePlacementId,
    sortOrder: s.sortOrder,
  }));
}

/** structurePayload 내 방 2D 좌표 형식 */
type RoomCoordMap = Record<string, { x: number; y: number; width: number; height: number }>;

/**
 * 방 목록(rooms API)과 집 구조(house-structure API)를 병렬로 조회하여
 * 프론트 StructureRoom[] + structureDiagramLayout을 반환한다.
 *
 * 백엔드 Room에는 2D 좌표가 없으므로 house-structure.structurePayload.rooms에서 보완한다.
 * 두 API 중 하나라도 실패하면 localStorage rooms를 폴백으로 사용한다.
 */
async function loadRoomsAndStructureFromApi(
  householdId: string,
  localRooms: StructureRoom[],
): Promise<{
  rooms: StructureRoom[];
  structureDiagramLayout?: HouseholdStructureDiagramLayout;
}> {
  const [rawRoomsResult, rawStructureResult] = await Promise.allSettled([
    apiFetch<
      Array<{
        id: string;
        structureRoomKey: string;
        displayName: string | null;
        sortOrder: number;
      }>
    >(`/api/households/${householdId}/rooms`),
    apiFetch<{
      structurePayload: Record<string, unknown>;
      diagramLayout: Record<string, unknown> | null;
    }>(`/api/households/${householdId}/house-structure`),
  ]);

  const localById = new Map(localRooms.map((r) => [r.id, r]));

  // structurePayload에서 방별 2D 좌표 추출
  const coordMap: RoomCoordMap =
    rawStructureResult.status === "fulfilled"
      ? ((rawStructureResult.value.structurePayload?.rooms ?? {}) as RoomCoordMap)
      : {};

  const diagramLayout: HouseholdStructureDiagramLayout | undefined =
    rawStructureResult.status === "fulfilled" && rawStructureResult.value.diagramLayout
      ? (rawStructureResult.value.diagramLayout as HouseholdStructureDiagramLayout)
      : undefined;

  if (rawRoomsResult.status === "fulfilled" && rawRoomsResult.value.length > 0) {
    const rooms: StructureRoom[] = rawRoomsResult.value
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((r) => {
        const coord = coordMap[r.id] ?? localById.get(r.id);
        return {
          id: r.id,
          name: r.displayName ?? r.structureRoomKey,
          x: coord?.x ?? 0,
          y: coord?.y ?? 0,
          width: coord?.width ?? 120,
          height: coord?.height ?? 80,
        };
      });
    return { rooms, structureDiagramLayout: diagramLayout };
  }

  // 방 목록 API 실패 시 localStorage 폴백
  return { rooms: localRooms, structureDiagramLayout: diagramLayout };
}

/** 거점 가구 배치를 API에서 로드 (방 ID 목록 기반) */
async function loadFurniturePlacementsFromApi(
  householdId: string,
  roomIds: string[],
): Promise<FurniturePlacement[]> {
  if (roomIds.length === 0) return [];
  const arrays = await Promise.all(
    roomIds.map((rid) =>
      apiFetch<
        Array<{
          id: string;
          roomId?: string;
          label: string;
          anchorDirectStorageId: string | null;
          sortOrder: number;
        }>
      >(
        `/api/households/${householdId}/rooms/${rid}/furniture-placements`,
      ).catch(() => []),
    ),
  );
  return arrays.flatMap((arr, i) =>
    arr.map((f) => ({
      id: f.id,
      roomId: roomIds[i]!,
      label: f.label,
      anchorDirectStorageId: f.anchorDirectStorageId ?? undefined,
      sortOrder: f.sortOrder,
    })),
  );
}

/* ─────────────────────────────────────────────────────── service ── */

export const dashboardApiHouseholdsClient: DashboardHouseholdsPort = {
  /* ── 거점 목록 ── */
  async list() {
    const remoteList =
      await apiFetch<
        { id: string; name: string; kind: string | null; createdAt: string }[]
      >("/api/households");

    const local = getHouseholds();
    const localById = new Map(local.map((h) => [h.id, h]));

    // 각 거점 병렬 로드: 멤버 + 카탈로그 + 보관장소 + 가구 배치
    const withData = await Promise.all(
      remoteList.map(async (remote) => {
        const household = mergeWithLocal(remote, localById.get(remote.id));

        const [members, catalog, storageLocations, roomsAndStructure] =
          await Promise.all([
            apiFetch<
              { id: string; email: string; displayName: string; role: string }[]
            >(`/api/households/${remote.id}/members`).catch(
              () =>
                [] as {
                  id: string;
                  email: string;
                  displayName: string;
                  role: string;
                }[],
            ),
            loadCatalogFromApi(remote.id).catch(
              () => household.catalog ?? cloneDefaultCatalog(),
            ),
            loadStorageLocationsFromApi(remote.id).catch(
              () => household.storageLocations ?? [],
            ),
            loadRoomsAndStructureFromApi(remote.id, household.rooms).catch(
              () => ({ rooms: household.rooms, structureDiagramLayout: household.structureDiagramLayout }),
            ),
          ]);

        household.members = members.map(mapMember);
        household.catalog = catalog;
        household.storageLocations = storageLocations;
        household.rooms = roomsAndStructure.rooms;
        if (roomsAndStructure.structureDiagramLayout !== undefined) {
          household.structureDiagramLayout = roomsAndStructure.structureDiagramLayout;
        }

        // 보관장소 roomId + rooms에서 방 ID 목록 추출 후 가구 배치 로드
        const roomIdsFromStorage = [
          ...new Set(
            storageLocations
              .map((s) => s.roomId)
              .filter((id): id is string => !!id),
          ),
        ];
        const roomIdsFromRooms = household.rooms.map((r) => r.id);
        const allRoomIds = [
          ...new Set([...roomIdsFromRooms, ...roomIdsFromStorage]),
        ];

        if (allRoomIds.length > 0) {
          const furniturePlacements = await loadFurniturePlacementsFromApi(
            remote.id,
            allRoomIds,
          ).catch(() => household.furniturePlacements ?? []);
          household.furniturePlacements = furniturePlacements;

          // 재고 품목 로드 (카탈로그 + 보관장소 + 가구 배치 이후에 수행)
          const inventoryItems = await loadInventoryItemsFromApi(
            remote.id,
            catalog,
            storageLocations,
            household.furniturePlacements,
          ).catch(() => household.items ?? []);
          household.items = inventoryItems;
        } else {
          // 가구 배치가 없어도 재고 품목 로드
          const inventoryItems = await loadInventoryItemsFromApi(
            remote.id,
            catalog,
            storageLocations,
            [],
          ).catch(() => household.items ?? []);
          household.items = inventoryItems;
        }

        return household;
      }),
    );

    // 구매 데이터 localStorage 동기화 (DashboardInventory 섹션의 purchases 표시용)
    const allPurchases = (
      await Promise.all(withData.map((h) => loadPurchasesForHousehold(h.id)))
    ).flat();
    setPurchases(allPurchases);

    // localStorage 동기화 (rooms/items/catalog 보존)
    setHouseholds(withData);
    return withData;
  },

  /* ── 거점 생성 ── */
  async create(name, kind) {
    const remote = await apiFetch<{
      id: string;
      name: string;
      kind: string | null;
      createdAt: string;
    }>("/api/households", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, kind }),
    });
    return mergeWithLocal(remote, undefined);
  },

  /* ── 거점 수정 ── */
  async update(id, updates) {
    const remote = await apiFetch<{
      id: string;
      name: string;
      kind: string | null;
      createdAt: string;
    }>(`/api/households/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const local = getHouseholds().find((h) => h.id === id);
    return mergeWithLocal(remote, local);
  },

  /* ── 거점 삭제 ── */
  async remove(id) {
    await apiFetch<void>(`/api/households/${id}`, { method: "DELETE" });
  },

  /* ── 전체 저장 (api 모드에서는 no-op; 개별 API 호출로 대체됨) ── */
  async saveAll(households) {
    setHouseholds(households); // localStorage 동기화만 유지
  },

  /* ── 방 목록 동기화 ── */
  async syncRooms(householdId, rooms) {
    const localById = new Map(rooms.map((r) => [r.id, r]));
    try {
      const data = await apiFetch<
        Array<{
          id: string;
          structureRoomKey: string;
          displayName: string | null;
          sortOrder: number;
        }>
      >(`/api/households/${householdId}/rooms/sync`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rooms: rooms.map((r, i) => ({
            structureRoomKey: r.id,
            displayName: r.name,
            sortOrder: i,
          })),
        }),
      });
      // 서버에서 할당된 UUID + 로컬 좌표를 병합하여 반환
      return data.map((sr) => {
        const local = localById.get(sr.structureRoomKey);
        return {
          id: sr.id,
          name: sr.displayName ?? sr.structureRoomKey,
          x: local?.x ?? 0,
          y: local?.y ?? 0,
          width: local?.width ?? 120,
          height: local?.height ?? 80,
        };
      });
    } catch (e) {
      console.error("방 동기화 API 오류:", e);
      return rooms; // 실패 시 로컬 목록을 그대로 반환
    }
  },

  /* ── 집 구조 저장 ── */
  async saveHouseStructure(householdId, rooms, layout) {
    const roomCoords: RoomCoordMap = Object.fromEntries(
      rooms.map((r) => [r.id, { x: r.x, y: r.y, width: r.width, height: r.height }]),
    );
    await apiFetch<unknown>(`/api/households/${householdId}/house-structure`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "default",
        structurePayload: { rooms: roomCoords },
        diagramLayout: layout ?? null,
      }),
    }).catch((e) => console.error("집 구조 저장 API 오류:", e));
  },

  /* ── 거점 유형 정의 ── */
  async listKinds() {
    try {
      const raw = await apiFetch<
        { kindId: string; label: string; sortOrder: number }[]
      >("/api/household-kind-definitions");
      if (!raw || raw.length === 0) {
        return getSharedHouseholdKindDefinitions();
      }
      const kinds = raw.map(mapKind);
      setSharedHouseholdKindDefinitions(kinds);
      return kinds;
    } catch {
      // 백엔드 실패 시 로컬 폴백
      const local = getSharedHouseholdKindDefinitions();
      return local.length > 0 ? local : cloneDefaultHouseholdKindDefinitions();
    }
  },

  async saveKinds(items) {
    const payload = items.map((item, i) => ({
      kindId: item.id,
      label: item.label,
      sortOrder: item.sortOrder ?? i,
    }));
    await apiFetch<unknown>("/api/household-kind-definitions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: payload }),
    });
    setSharedHouseholdKindDefinitions(items);
  },

  /* ── 멤버 목록 ── */
  async listMembers(householdId) {
    const raw = await apiFetch<
      { id: string; email: string; displayName: string; role: string }[]
    >(`/api/households/${householdId}/members`);
    return raw.map(mapMember);
  },

  /* ── 멤버 역할 변경 ── */
  async changeMemberRole(householdId, memberId, role) {
    await apiFetch<unknown>(
      `/api/households/${householdId}/members/${memberId}/role`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      },
    );
  },

  /* ── 멤버 제거 ── */
  async removeMember(householdId, memberId) {
    await apiFetch<void>(`/api/households/${householdId}/members/${memberId}`, {
      method: "DELETE",
    });
  },

  /* ── 초대 목록 ── */
  async listInvitations(householdId) {
    const raw = await apiFetch<
      {
        id: string;
        householdId: string;
        role: string;
        token: string;
        createdAt: string;
      }[]
    >(`/api/households/${householdId}/invitations`);
    return raw.map(mapInvitation);
  },

  /* ── 초대 생성 ── */
  async createInvitation(householdId, params) {
    const raw = await apiFetch<{
      id: string;
      householdId: string;
      role: string;
      token: string;
      createdAt: string;
    }>(`/api/households/${householdId}/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    return mapInvitation(raw);
  },

  /* ── 초대 취소 ── */
  async revokeInvitation(householdId, invitationId) {
    await apiFetch<void>(
      `/api/households/${householdId}/invitations/${invitationId}`,
      { method: "DELETE" },
    );
  },

  /* ── 카탈로그 동기화 ── */
  async syncCatalogDiff(householdId, before, after) {
    await syncCatalogDiffImpl(householdId, before, after);
  },

  /* ── 재고 소비 기록 ── */
  async recordInventoryConsumption(householdId, itemId, quantity, memo) {
    await apiFetch(
      `/api/households/${householdId}/inventory-items/${itemId}/logs/consumption`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity, memo: memo?.trim() }),
      },
    ).catch((e) => console.error("소비 기록 API 오류:", e));
  },

  /* ── 재고 폐기 기록 ── */
  async recordInventoryWaste(householdId, itemId, quantity, reason, memo) {
    await apiFetch(
      `/api/households/${householdId}/inventory-items/${itemId}/logs/waste`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity, reason, memo: memo?.trim() }),
      },
    ).catch((e) => console.error("폐기 기록 API 오류:", e));
  },

  /* ── 가구 배치 생성 ── */
  async createFurniturePlacement(
    householdId,
    roomId,
    label,
    anchorDirectStorageId,
    sortOrder,
  ) {
    const raw = await apiFetch<{
      id: string;
      roomId: string;
      label: string;
      anchorDirectStorageId: string | null;
      sortOrder: number;
    }>(`/api/households/${householdId}/rooms/${roomId}/furniture-placements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label,
        anchorDirectStorageId: anchorDirectStorageId ?? null,
        sortOrder: sortOrder ?? 0,
      }),
    });
    return {
      id: raw.id,
      roomId: raw.roomId ?? roomId,
      label: raw.label,
      anchorDirectStorageId: raw.anchorDirectStorageId ?? undefined,
      sortOrder: raw.sortOrder,
    };
  },

  /* ── 가구 배치 수정 ── */
  async patchFurniturePlacement(householdId, id, patch) {
    await apiFetch<unknown>(
      `/api/households/${householdId}/furniture-placements/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      },
    ).catch((e) => console.error("가구 배치 수정 API 오류:", e));
  },

  /* ── 가구 배치 삭제 ── */
  async removeFurniturePlacement(householdId, id) {
    await apiFetch<unknown>(
      `/api/households/${householdId}/furniture-placements/${id}`,
      { method: "DELETE" },
    ).catch((e) => console.error("가구 배치 삭제 API 오류:", e));
  },

  /* ── 보관 장소 생성 ── */
  async createStorageLocation(householdId, data) {
    const raw = await apiFetch<{
      id: string;
      name: string;
      roomId: string | null;
      furniturePlacementId: string | null;
      sortOrder: number;
    }>(`/api/households/${householdId}/storage-locations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return {
      id: raw.id,
      name: raw.name,
      roomId: raw.roomId,
      furniturePlacementId: raw.furniturePlacementId,
      sortOrder: raw.sortOrder,
    };
  },

  /* ── 보관 장소 수정 ── */
  async updateStorageLocation(householdId, id, name) {
    await apiFetch<unknown>(
      `/api/households/${householdId}/storage-locations/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      },
    ).catch((e) => console.error("보관 장소 수정 API 오류:", e));
  },

  /* ── 보관 장소 삭제 ── */
  async removeStorageLocation(householdId, id) {
    await apiFetch<unknown>(
      `/api/households/${householdId}/storage-locations/${id}`,
      { method: "DELETE" },
    ).catch((e) => console.error("보관 장소 삭제 API 오류:", e));
  },

  /* ── 재고 품목 등록 ── */
  async createInventoryItem(householdId, data) {
    const raw = await apiFetch<{ id: string }>(
      `/api/households/${householdId}/inventory-items`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productVariantId: data.productVariantId,
          storageLocationId: data.storageLocationId,
          quantity: data.quantity,
          minStockLevel: data.minStockLevel ?? null,
        }),
      },
    );
    return { id: raw.id };
  },

  /* ── 구매-재고 품목 연결 ── */
  async linkPurchaseToInventoryItem(householdId, purchaseId, inventoryItemId) {
    await apiFetch<unknown>(
      `/api/households/${householdId}/purchases/${purchaseId}/link-inventory`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventoryItemId }),
      },
    ).catch((e) => console.error("구매-재고 연결 API 오류:", e));
  },

  /* ── 재고 수량 수동 조정 ── */
  async recordInventoryAdjustment(householdId, itemId, quantityDelta, memo) {
    await apiFetch<unknown>(
      `/api/households/${householdId}/inventory-items/${itemId}/logs/adjustment`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantityDelta, memo: memo?.trim() }),
      },
    ).catch((e) => console.error("재고 수동 조정 API 오류:", e));
  },

  /* ── 재고 수량 절댓값 직접 설정 ── */
  async updateInventoryItemQuantity(householdId, itemId, quantity) {
    await apiFetch<unknown>(
      `/api/households/${householdId}/inventory-items/${itemId}/quantity`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      },
    ).catch((e) => console.error("재고 수량 직접 설정 API 오류:", e));
  },

  /* ── 유통기한 임박 배치 목록 조회 ── */
  async loadExpiringBatches(householdId, days) {
    try {
      const qs = days !== undefined ? `?days=${days}` : "";
      return await apiFetch<{ id: string; purchaseId: string; quantity: number; expirationDate: string | null }[]>(
        `/api/households/${householdId}/batches/expiring${qs}`,
      );
    } catch (e) {
      console.error("유통기한 임박 배치 조회 오류:", e);
      return [];
    }
  },

  /* ── 만료된 배치 목록 조회 ── */
  async loadExpiredBatches(householdId) {
    try {
      const res = await apiFetch<{ id: string; purchaseId: string; quantity: number; expirationDate: string | null }[]>(
        `/api/households/${householdId}/batches/expired`,
      );
      return res;
    } catch (e) {
      console.error("만료된 배치 조회 오류:", e);
      return [];
    }
  },
};
