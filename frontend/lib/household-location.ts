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

/** 물품 등록 드롭다운용 — 방 직속 칸 다음, 가구별 칸 순 */
export function listStorageOptionsForRoom(
  h: Household,
  roomId: string,
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
  return out;
}

export function formatLocationBreadcrumb(
  h: Household,
  item: InventoryRow,
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
  return `${roomName} › ${slot.name}`;
}

/**
 * 방마다 직속 보관 칸이 하나도 없으면 「방(기본)」 슬롯을 둔다 (idempotent).
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

/** 배열 기본값·방(기본) 슬롯까지 한 번에 맞춘다 (상품 카탈로그는 공통 저장소) */
export function ensureHouseholdShape(h: Household): Household {
  const withArrays: Household = {
    ...h,
    furniturePlacements: h.furniturePlacements ?? [],
    storageLocations: h.storageLocations ?? [],
  };
  return ensureDefaultRoomStorageSlots(withArrays);
}
