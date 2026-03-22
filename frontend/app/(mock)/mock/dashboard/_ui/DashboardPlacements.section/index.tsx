"use client";

import { AlertModal } from "@/app/_ui/alert-modal";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { useDashboard } from "../../_hooks/useDashboard";
import { newEntityId } from "../../_lib/dashboard-helpers";
import type {
  FurniturePlacement,
  Household,
  StorageLocationRow,
} from "@/types/domain";

const inputClass =
  "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500";

const btnSm =
  "cursor-pointer rounded-lg border border-zinc-600 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800";

const btnDanger =
  "cursor-pointer rounded-lg border border-rose-900/50 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-950/40";

type PendingDelete =
  | { kind: "storage"; id: string }
  | { kind: "furniture"; id: string };

type DashboardPlacementsSectionProps = {
  selected: Household | null;
  /** 방 관리에서 선택한 방만 이 섹션에 표시 */
  selectedRoomId: string | null;
  /** 제목 클릭 시 오른쪽 물품 추가 패널을 펼치고 스크롤 */
  onFocusItemAddPanel?: () => void;
};

export function DashboardPlacementsSection({
  selected,
  selectedRoomId,
  onFocusItemAddPanel,
}: DashboardPlacementsSectionProps) {
  const { 거점을_갱신_한다 } = useDashboard();
  const [roomDirectDraft, setRoomDirectDraft] = useState<
    Record<string, string>
  >({});
  const [furnitureDraft, setFurnitureDraft] = useState<Record<string, string>>(
    {},
  );
  const [slotDraft, setSlotDraft] = useState<Record<string, string>>({});
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(
    null,
  );

  if (!selected) return null;

  const placements = selected.furniturePlacements ?? [];
  const slots = selected.storageLocations ?? [];

  const visibleRooms =
    selectedRoomId != null
      ? selected.rooms.filter((r) => r.id === selectedRoomId)
      : [];

  const furnitureInRoom = (roomId: string) =>
    [...placements]
      .filter((f) => f.roomId === roomId)
      .sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.label.localeCompare(b.label, "ko"),
      );

  const roomDirectSlots = (roomId: string) =>
    slots.filter(
      (s) => s.roomId === roomId && (s.furniturePlacementId == null || s.furniturePlacementId === ""),
    );

  const slotsUnderFurniture = (furnitureId: string) =>
    slots.filter((s) => s.furniturePlacementId === furnitureId);

  const handleAddRoomSlot = (roomId: string) => {
    const name = (roomDirectDraft[roomId] ?? "").trim();
    if (!name) {
      toast({
        title: "이름을 입력하세요",
        description: "보관 칸 이름(예: 냉장고, 벽장)을 적어 주세요.",
        variant: "warning",
      });
      return;
    }
    const id = newEntityId();
    const nextSort =
      Math.max(0, ...roomDirectSlots(roomId).map((s) => s.sortOrder ?? 0)) + 1;
    const row: StorageLocationRow = {
      id,
      name,
      roomId,
      furniturePlacementId: null,
      sortOrder: nextSort,
    };
    거점을_갱신_한다(selected.id, (h) => ({
      ...h,
      storageLocations: [...(h.storageLocations ?? []), row],
    }));
    setRoomDirectDraft((d) => ({ ...d, [roomId]: "" }));
    toast({ title: "보관 칸 추가됨", description: name });
  };

  const handleAddFurniture = (roomId: string) => {
    const label = (furnitureDraft[roomId] ?? "").trim();
    if (!label) {
      toast({
        title: "가구 이름을 입력하세요",
        description: "예: 책상, 식탁, 협탁",
        variant: "warning",
      });
      return;
    }
    const id = newEntityId();
    const inRoom = furnitureInRoom(roomId);
    const nextSort =
      Math.max(0, ...inRoom.map((f) => f.sortOrder ?? 0)) + 1;
    const fp: FurniturePlacement = {
      id,
      roomId,
      label,
      sortOrder: nextSort,
    };
    거점을_갱신_한다(selected.id, (h) => ({
      ...h,
      furniturePlacements: [...(h.furniturePlacements ?? []), fp],
    }));
    setFurnitureDraft((d) => ({ ...d, [roomId]: "" }));
    toast({ title: "가구 배치 추가됨", description: label });
  };

  const handleAddFurnitureSlot = (furnitureId: string) => {
    const name = (slotDraft[furnitureId] ?? "").trim();
    if (!name) {
      toast({
        title: "칸 이름을 입력하세요",
        description: "예: 서랍 왼쪽, 상판 위",
        variant: "warning",
      });
      return;
    }
    const id = newEntityId();
    const under = slotsUnderFurniture(furnitureId);
    const nextSort =
      Math.max(0, ...under.map((s) => s.sortOrder ?? 0)) + 1;
    const row: StorageLocationRow = {
      id,
      name,
      roomId: null,
      furniturePlacementId: furnitureId,
      sortOrder: nextSort,
    };
    거점을_갱신_한다(selected.id, (h) => ({
      ...h,
      storageLocations: [...(h.storageLocations ?? []), row],
    }));
    setSlotDraft((d) => ({ ...d, [furnitureId]: "" }));
    toast({ title: "가구 아래 보관 칸 추가됨", description: name });
  };

  const confirmDeleteStorage = (storageId: string) => {
    거점을_갱신_한다(selected.id, (h) => ({
      ...h,
      storageLocations: (h.storageLocations ?? []).filter(
        (s) => s.id !== storageId,
      ),
      items: h.items.filter((i) => i.storageLocationId !== storageId),
    }));
    toast({ title: "보관 칸 삭제됨", variant: "success" });
  };

  const confirmDeleteFurniture = (furnitureId: string) => {
    const slotIds = new Set(
      (selected.storageLocations ?? [])
        .filter((s) => s.furniturePlacementId === furnitureId)
        .map((s) => s.id),
    );
    거점을_갱신_한다(selected.id, (h) => ({
      ...h,
      furniturePlacements: (h.furniturePlacements ?? []).filter(
        (f) => f.id !== furnitureId,
      ),
      storageLocations: (h.storageLocations ?? []).filter(
        (s) => s.furniturePlacementId !== furnitureId,
      ),
      items: h.items.filter(
        (i) => !i.storageLocationId || !slotIds.has(i.storageLocationId),
      ),
    }));
    toast({ title: "가구 배치 삭제됨", description: "연결된 보관 칸·재고도 정리되었습니다.", variant: "success" });
  };

  const pendingDescription = () => {
    if (!pendingDelete) return "";
    if (pendingDelete.kind === "storage") {
      const s = slots.find((x) => x.id === pendingDelete.id);
      return s
        ? `「${s.name}」을(를) 삭제합니다. 이 칸에만 있던 재고 행도 함께 제거됩니다.`
        : "삭제하시겠습니까?";
    }
    const f = placements.find((x) => x.id === pendingDelete.id);
    return f
      ? `「${f.label}」 가구 배치를 삭제합니다. 아래 보관 칸과 그 재고도 함께 제거됩니다.`
      : "삭제하시겠습니까?";
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      <button
        type="button"
        title="오른쪽 아래 물품 추가 패널을 펼칩니다"
        className="w-full rounded-xl text-left outline-none transition-colors hover:bg-teal-500/[0.05] focus-visible:ring-2 focus-visible:ring-teal-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 -mx-1 -mt-1 px-1 py-1"
        onClick={() => onFocusItemAddPanel?.()}
      >
        <h2 className="text-base font-semibold text-white">
          가구 배치 · 보관 장소
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          왼쪽「방 관리」에서 선택한 방에 대해서만 직속 칸·가구 배치를
          편집합니다. 물품 등록 시「어디에 있는지」까지 지정할 수 있습니다.
        </p>
        <p className="mt-2 text-[11px] text-teal-500/75">
          제목 영역을 누르면 오른쪽「물품 추가」패널이 펼쳐집니다.
        </p>
      </button>

      {selected.rooms.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-zinc-700 px-4 py-6 text-center text-sm text-zinc-500">
          먼저 방을 추가한 뒤, 방을 선택하면 이 영역에서 가구·보관 칸을 입력할 수
          있습니다.
        </p>
      ) : selectedRoomId == null ? (
        <p className="mt-4 rounded-xl border border-dashed border-zinc-700 px-4 py-6 text-center text-sm text-zinc-500">
          왼쪽「방 관리」에서 방 탭을 눌러 선택하세요. 선택한 방의 가구·보관 칸만
          여기에 표시됩니다.
        </p>
      ) : visibleRooms.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 px-4 py-6 text-center text-sm text-amber-200/90">
          선택한 방을 찾을 수 없습니다. 방 목록이 바뀌었다면 다시 선택해 주세요.
        </p>
      ) : (
        <ul className="mt-4 space-y-5">
          {visibleRooms.map((room) => (
            <li
              key={room.id}
              className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4"
            >
              <h3 className="text-sm font-semibold text-teal-200/95">
                {room.name}
              </h3>

              <section className="mt-3">
                <p className="text-xs font-medium text-zinc-500">
                  방 직속 보관 칸
                </p>
                <ul className="mt-2 space-y-2">
                  {roomDirectSlots(room.id).length === 0 ? (
                    <li className="text-xs text-zinc-600">등록된 칸이 없습니다.</li>
                  ) : (
                    roomDirectSlots(room.id).map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center justify-between gap-2 rounded-lg bg-zinc-900/80 px-3 py-2 text-sm text-zinc-300"
                      >
                        <span>{s.name}</span>
                        <button
                          type="button"
                          className={btnDanger}
                          onClick={() =>
                            setPendingDelete({ kind: "storage", id: s.id })
                          }
                        >
                          삭제
                        </button>
                      </li>
                    ))
                  )}
                </ul>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                  <input
                    value={roomDirectDraft[room.id] ?? ""}
                    onChange={(e) =>
                      setRoomDirectDraft((d) => ({
                        ...d,
                        [room.id]: e.target.value,
                      }))
                    }
                    placeholder="예: 냉장고, 벽장"
                    className={`${inputClass} sm:min-w-0 sm:flex-1`}
                  />
                  <button
                    type="button"
                    className={`${btnSm} sm:w-24`}
                    onClick={() => handleAddRoomSlot(room.id)}
                  >
                    칸 추가
                  </button>
                </div>
              </section>

              <section className="mt-5 border-t border-zinc-800/80 pt-4">
                <p className="text-xs font-medium text-zinc-500">가구 배치</p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                  <input
                    value={furnitureDraft[room.id] ?? ""}
                    onChange={(e) =>
                      setFurnitureDraft((d) => ({
                        ...d,
                        [room.id]: e.target.value,
                      }))
                    }
                    placeholder="예: 책상, 식탁"
                    className={`${inputClass} sm:min-w-0 sm:flex-1`}
                  />
                  <button
                    type="button"
                    className={`${btnSm} sm:w-28`}
                    onClick={() => handleAddFurniture(room.id)}
                  >
                    가구 추가
                  </button>
                </div>

                <ul className="mt-3 space-y-4">
                  {furnitureInRoom(room.id).map((fp) => (
                    <li
                      key={fp.id}
                      className="rounded-lg border border-zinc-800/90 bg-zinc-900/40 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-medium text-zinc-200">
                          {fp.label}
                        </span>
                        <button
                          type="button"
                          className={btnDanger}
                          onClick={() =>
                            setPendingDelete({ kind: "furniture", id: fp.id })
                          }
                        >
                          가구 삭제
                        </button>
                      </div>
                      <p className="mt-2 text-[11px] text-zinc-600">
                        이 가구 아래 보관 칸
                      </p>
                      <ul className="mt-1 space-y-1.5">
                        {slotsUnderFurniture(fp.id).length === 0 ? (
                          <li className="text-xs text-zinc-600">
                            칸이 없습니다.
                          </li>
                        ) : (
                          slotsUnderFurniture(fp.id).map((s) => (
                            <li
                              key={s.id}
                              className="flex items-center justify-between gap-2 rounded-md bg-zinc-950/60 px-2 py-1.5 text-xs text-zinc-400"
                            >
                              <span>{s.name}</span>
                              <button
                                type="button"
                                className="text-rose-400/90 hover:underline"
                                onClick={() =>
                                  setPendingDelete({ kind: "storage", id: s.id })
                                }
                              >
                                삭제
                              </button>
                            </li>
                          ))
                        )}
                      </ul>
                      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                        <input
                          value={slotDraft[fp.id] ?? ""}
                          onChange={(e) =>
                            setSlotDraft((d) => ({
                              ...d,
                              [fp.id]: e.target.value,
                            }))
                          }
                          placeholder="예: 서랍 왼쪽"
                          className={`${inputClass} sm:flex-1`}
                        />
                        <button
                          type="button"
                          className={`${btnSm} sm:w-24`}
                          onClick={() => handleAddFurnitureSlot(fp.id)}
                        >
                          칸 추가
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </li>
          ))}
        </ul>
      )}

      <AlertModal
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={
          pendingDelete?.kind === "furniture"
            ? "가구 배치 삭제"
            : "보관 칸 삭제"
        }
        description={pendingDescription()}
        confirmLabel="삭제"
        cancelLabel="취소"
        variant="danger"
        onConfirm={() => {
          if (!pendingDelete) return;
          if (pendingDelete.kind === "storage") {
            confirmDeleteStorage(pendingDelete.id);
          } else {
            confirmDeleteFurniture(pendingDelete.id);
          }
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
