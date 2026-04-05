/**
 * ERD: Room → FurniturePlacement → StorageLocation → InventoryItem
 * mock·로컬 Household 스냅샷용 위치 해석·표시
 */
import type { Household, InventoryRow } from "@/types/domain";

export function resolveRoomIdForStorageLocation(
  h: Household,
  slotId: string,
): string | null {
  const slot = (h.storageLocations ?? []).find((s) => s.id === slotId);
  if (!slot) return null;
  if (slot.furniturePlacementId) {
    const fp = (h.furniturePlacements ?? []).find(
      (f) => f.id === slot.furniturePlacementId,
    );
    return fp?.roomId ?? null;
  }
  return slot.roomId;
}

/** 재고 행이 속한 방 id (슬롯이 있으면 슬롯 기준, 없으면 roomId) */
export function resolveItemRoomId(h: Household, item: InventoryRow): string {
  if (item.storageLocationId) {
    const r = resolveRoomIdForStorageLocation(h, item.storageLocationId);
    if (r) return r;
  }
  return item.roomId;
}

export type StorageOption = { id: string; label: string };

/**
 * 재고 등록 드롭다운용 — 가구별 보관 장소 순.
 * v2.8: 직속 보관 장소(roomId 직접, furniturePlacementId 없음)는 레거시 호환용으로 유지.
 */
export function listStorageOptionsForRoom(
  h: Household,
  roomId: string,
  appliances?: { id: string; name: string; roomId?: string }[],
): StorageOption[] {
  const out: StorageOption[] = [];
  const slots = h.storageLocations ?? [];
  const room = h.rooms.find((r) => r.id === roomId);
  const roomName = room?.name ?? "방";

  const direct = slots
    .filter(
      (s) =>
        s.roomId === roomId &&
        (s.furniturePlacementId == null || s.furniturePlacementId === ""),
    )
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  for (const s of direct) {
    out.push({ id: s.id, label: `${roomName} › ${s.name}` });
  }

  const fps = (h.furniturePlacements ?? [])
    .filter((f) => f.roomId === roomId)
    .sort(
      (a, b) =>
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
        a.label.localeCompare(b.label, "ko"),
    );

  for (const fp of fps) {
    const sub = slots
      .filter((s) => s.furniturePlacementId === fp.id)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    for (const s of sub) {
      out.push({
        id: s.id,
        label: `${roomName} › ${fp.label} › ${s.name}`,
      });
    }
  }

  // v2.8: 가전 하위 보관 장소 — 이 방에 설치된 가전만 표시
  const roomAppliances = (appliances ?? []).filter((a) => a.roomId === roomId);
  for (const appl of roomAppliances) {
    const appSlots = slots
      .filter((s) => s.applianceId === appl.id)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    for (const s of appSlots) {
      out.push({
        id: s.id,
        label: `${roomName} › ${appl.name} › ${s.name}`,
      });
    }
  }

  return out;
}

/**
 * 방이 이미 선택된 UI에서 — ERD상 보관 블록만 표시 (가구 › 보관 장소 또는 방 직속 보관 장소 이름).
 */
export function formatStorageBlockHeading(
  h: Household,
  storageLocationId: string | undefined,
  appliances?: { id: string; name: string }[],
): string {
  if (!storageLocationId) {
    return "보관 장소 미지정";
  }
  const slot = (h.storageLocations ?? []).find((s) => s.id === storageLocationId);
  if (!slot) {
    return "알 수 없는 보관 장소";
  }
  if (slot.furniturePlacementId) {
    const fp = (h.furniturePlacements ?? []).find(
      (f) => f.id === slot.furniturePlacementId,
    );
    const furnitureLabel = fp?.label ?? "가구";
    return `${furnitureLabel} › ${slot.name}`;
  }
  if (slot.applianceId != null && slot.applianceId !== "") {
    const appl = (appliances ?? []).find((a) => a.id === slot.applianceId);
    const applLabel = appl?.name ?? "가전";
    return `${applLabel} › ${slot.name}`;
  }
  return slot.name;
}

export type StorageItemGroup = {
  storageLocationId: string | null;
  heading: string;
  items: InventoryRow[];
};

/** 같은 방 안 재고를 보관 장소(블록)별로 묶는다 — `listStorageOptionsForRoom` 순서를 따름 */
export function groupInventoryByStorageForRoom(
  h: Household,
  roomId: string,
  items: InventoryRow[],
): StorageItemGroup[] {
  const bucket = new Map<string | null, InventoryRow[]>();
  for (const it of items) {
    const key = it.storageLocationId ?? null;
    const arr = bucket.get(key) ?? [];
    arr.push(it);
    bucket.set(key, arr);
  }
  const orderIds = listStorageOptionsForRoom(h, roomId).map((o) => o.id);
  const rank = (slotId: string | null) => {
    if (slotId === null) return 1_000_000;
    const i = orderIds.indexOf(slotId);
    return i === -1 ? 500_000 : i;
  };
  const entries = [...bucket.entries()].sort(([a], [b]) => {
    const d = rank(a) - rank(b);
    if (d !== 0) return d;
    return (a ?? "").localeCompare(b ?? "");
  });
  return entries.map(([storageLocationId, groupItems]) => ({
    storageLocationId,
    heading: formatStorageBlockHeading(
      h,
      storageLocationId ?? undefined,
    ),
    items: [...groupItems].sort((x, y) =>
      x.name.localeCompare(y.name, "ko", { sensitivity: "base" }),
    ),
  }));
}

/** 장보기 줄에 보관 위치 힌트 — `storageLocationId`만 있으면 방은 슬롯에서 해석 */
export function formatShoppingListTargetStorage(
  h: Household,
  storageLocationId: string | undefined,
): string | null {
  if (!storageLocationId) return null;
  const roomId = resolveRoomIdForStorageLocation(h, storageLocationId) ?? "";
  const stub: InventoryRow = {
    id: "_shopping_hint",
    name: "",
    quantity: 0,
    unit: "",
    roomId,
    storageLocationId,
  };
  return formatLocationBreadcrumb(h, stub);
}

export function formatLocationBreadcrumb(
  h: Household,
  item: InventoryRow,
  appliances?: { id: string; name: string }[],
): string {
  const room = h.rooms.find((r) => r.id === item.roomId);
  const roomName = room?.name ?? "방";
  if (!item.storageLocationId) {
    return roomName;
  }
  const slot = (h.storageLocations ?? []).find(
    (s) => s.id === item.storageLocationId,
  );
  if (!slot) {
    return roomName;
  }
  if (slot.furniturePlacementId) {
    const fp = (h.furniturePlacements ?? []).find(
      (f) => f.id === slot.furniturePlacementId,
    );
    const furnitureLabel = fp?.label ?? "가구";
    return `${roomName} › ${furnitureLabel} › ${slot.name}`;
  }
  if (slot.applianceId != null && slot.applianceId !== "") {
    const appl = (appliances ?? []).find((a) => a.id === slot.applianceId);
    const applLabel = appl?.name ?? "가전";
    return `${roomName} › ${applLabel} › ${slot.name}`;
  }
  return `${roomName} › ${slot.name}`;
}

/** 재고 이력 표 — 거점 / 방 / 장소(직속 보관 장소 또는 가구) / 세부장소(가구 아래 보관 장소) */
export type LedgerLocationColumns = {
  householdName: string;
  roomName: string;
  /** 방 직속 보관 장소 이름, 또는 가구 라벨 */
  placeLabel: string;
  /** 가구 아래 보관 장소만; 직속 보관이면 "-" */
  detailLabel: string;
};

/**
 * 품목 스냅샷으로 거점·방·장소·세부를 나눈다.
 * 품목이 없으면 거점명만 채우고 나머지는 "-".
 */
export function resolveLedgerLocationColumns(
  h: Household,
  inventoryItemId: string,
  appliances?: { id: string; name: string }[],
): LedgerLocationColumns {
  const item = h.items.find((it) => it.id === inventoryItemId);
  if (!item) {
    return {
      householdName: h.name,
      roomName: "-",
      placeLabel: "-",
      detailLabel: "-",
    };
  }
  const room = h.rooms.find((r) => r.id === item.roomId);
  const roomName = room?.name ?? "-";
  if (!item.storageLocationId) {
    return {
      householdName: h.name,
      roomName,
      placeLabel: "-",
      detailLabel: "-",
    };
  }
  const slot = (h.storageLocations ?? []).find(
    (s) => s.id === item.storageLocationId,
  );
  if (!slot) {
    return {
      householdName: h.name,
      roomName,
      placeLabel: "-",
      detailLabel: "-",
    };
  }
  if (slot.furniturePlacementId) {
    const fp = (h.furniturePlacements ?? []).find(
      (f) => f.id === slot.furniturePlacementId,
    );
    const furnitureLabel = fp?.label ?? "가구";
    return {
      householdName: h.name,
      roomName,
      placeLabel: furnitureLabel,
      detailLabel: slot.name,
    };
  }
  if (slot.applianceId != null && slot.applianceId !== "") {
    const appl = (appliances ?? []).find((a) => a.id === slot.applianceId);
    return {
      householdName: h.name,
      roomName,
      placeLabel: appl?.name ?? "가전",
      detailLabel: slot.name,
    };
  }
  return {
    householdName: h.name,
    roomName,
    placeLabel: slot.name,
    detailLabel: "-",
  };
}

/**
 * 재고 이력 등 — `resolveLedgerLocationColumns`를 ` › ` 로 이은 한 줄 문자열.
 */
export function formatLedgerLocationLabel(
  h: Household,
  inventoryItemId: string,
): string {
  const c = resolveLedgerLocationColumns(h, inventoryItemId);
  const parts: string[] = [c.householdName];
  if (c.roomName !== "-") parts.push(c.roomName);
  if (c.placeLabel !== "-") parts.push(c.placeLabel);
  if (c.detailLabel !== "-") parts.push(c.detailLabel);
  return parts.join(" › ");
}

/**
 * 방마다 직속 보관 장소가 하나도 없으면 「방(기본)」 슬롯을 둔다 (idempotent).
 */
export function ensureDefaultRoomStorageSlots(h: Household): Household {
  const slots = [...(h.storageLocations ?? [])];
  let changed = false;
  for (const room of h.rooms) {
    const hasDirect = slots.some(
      (s) =>
        s.roomId === room.id &&
        (s.furniturePlacementId == null || s.furniturePlacementId === ""),
    );
    if (!hasDirect) {
      const id = `sl-default-${room.id}`;
      if (!slots.some((s) => s.id === id)) {
        slots.push({
          id,
          name: "방(기본)",
          roomId: room.id,
          furniturePlacementId: null,
          sortOrder: 0,
        });
        changed = true;
      }
    }
  }
  return changed ? { ...h, storageLocations: slots } : h;
}

/**
 * v2.8: 가전 하위 보관 장소 목록 — applianceId로 필터.
 * Household.storageLocations에서 해당 가전에 연결된 보관 장소를 반환한다.
 */
export function listStorageLocationsForAppliance(
  h: Household,
  applianceId: string,
): StorageOption[] {
  const slots = h.storageLocations ?? [];
  return slots
    .filter((s) => s.applianceId === applianceId)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((s) => ({ id: s.id, label: s.name }));
}

/**
 * v2.8: 가전 하위 재고를 보관 장소별로 묶는다.
 */
export function groupInventoryByStorageForAppliance(
  h: Household,
  applianceId: string,
  items: import("@/types/domain").InventoryRow[],
): StorageItemGroup[] {
  const appSlotIds = new Set(
    (h.storageLocations ?? [])
      .filter((s) => s.applianceId === applianceId)
      .map((s) => s.id),
  );
  const appItems = items.filter(
    (it) => it.storageLocationId && appSlotIds.has(it.storageLocationId),
  );
  const bucket = new Map<string | null, import("@/types/domain").InventoryRow[]>();
  for (const it of appItems) {
    const key = it.storageLocationId ?? null;
    const arr = bucket.get(key) ?? [];
    arr.push(it);
    bucket.set(key, arr);
  }
  return [...bucket.entries()].map(([storageLocationId, groupItems]) => ({
    storageLocationId,
    heading: (h.storageLocations ?? []).find((s) => s.id === storageLocationId)
      ?.name ?? "알 수 없는 보관 장소",
    items: [...groupItems].sort((x, y) =>
      x.name.localeCompare(y.name, "ko", { sensitivity: "base" }),
    ),
  }));
}

/** 배열 기본값·방(기본) 슬롯까지 한 번에 맞춘다 (상품 카탈로그는 공통 저장소) */
export function ensureHouseholdShape(h: Household): Household {
  const withArrays: Household = {
    ...h,
    furniturePlacements: h.furniturePlacements ?? [],
    storageLocations: h.storageLocations ?? [],
  };
  return ensureDefaultRoomStorageSlots(withArrays);
}
