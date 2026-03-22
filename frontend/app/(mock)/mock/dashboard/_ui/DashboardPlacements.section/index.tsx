"use client";

import { AlertModal } from "@/app/_ui/alert-modal";
import { FormModal } from "@/app/_ui/form-modal";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useDashboard } from "../../_hooks/useDashboard";
import { newEntityId } from "../../_lib/dashboard-helpers";
import type {
  FurniturePlacement,
  Household,
  StorageLocationRow,
} from "@/types/domain";

const inputClass =
  "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500";

const selectClass =
  "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500";

/** 주요 추가 동작 — 같은 스타일로 통일 */
const btnAdd =
  "cursor-pointer shrink-0 rounded-lg border border-teal-600/60 bg-teal-950/40 px-3 py-2 text-xs font-medium text-teal-100 hover:bg-teal-900/35";

/** 직속 칸 추가 — 탭 줄과 톤 맞춤(배경 없음) */
const btnAddDirectSlot =
  "cursor-pointer shrink-0 rounded-lg border border-teal-600/60 bg-transparent px-3 py-2 text-xs font-medium text-teal-100 hover:border-teal-500/70 hover:bg-teal-500/[0.06]";

const btnDangerIcon =
  "inline-flex cursor-pointer items-center justify-center rounded-lg border border-rose-900/50 p-2 text-rose-400 hover:bg-rose-950/40";

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={cn("size-4", className)}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
      />
    </svg>
  );
}

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
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(
    null,
  );
  /** 선택한 방에서 보고 있는 직속 칸 탭 */
  const [activeDirectSlotId, setActiveDirectSlotId] = useState<string | null>(
    null,
  );
  const [directSlotModalOpen, setDirectSlotModalOpen] = useState(false);
  const [directSlotModalRoomId, setDirectSlotModalRoomId] = useState<
    string | null
  >(null);
  const [directSlotModalDraft, setDirectSlotModalDraft] = useState("");

  const [furnitureModalOpen, setFurnitureModalOpen] = useState(false);
  const [furnitureModalRoomId, setFurnitureModalRoomId] = useState<
    string | null
  >(null);
  const [furnitureModalSlotId, setFurnitureModalSlotId] = useState<
    string | null
  >(null);
  const [furnitureModalDraft, setFurnitureModalDraft] = useState("");

  const [subSlotModalOpen, setSubSlotModalOpen] = useState(false);
  const [subSlotModalFurnitureId, setSubSlotModalFurnitureId] = useState<
    string | null
  >(null);
  const [subSlotModalDraft, setSubSlotModalDraft] = useState("");

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
        (a, b) =>
          (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
          a.label.localeCompare(b.label, "ko"),
      );

  const roomDirectSlots = (roomId: string) =>
    slots
      .filter(
        (s) =>
          s.roomId === roomId &&
          (s.furniturePlacementId == null || s.furniturePlacementId === ""),
      )
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const furnitureOnSlot = (roomId: string, slotId: string) =>
    furnitureInRoom(roomId).filter(
      (f) => f.anchorDirectStorageId === slotId,
    );

  const slotsUnderFurniture = (furnitureId: string) =>
    slots.filter((s) => s.furniturePlacementId === furnitureId);

  /** 직속 칸 목록이 바뀌면 선택 탭을 유효한 값으로 맞춤 */
  useEffect(() => {
    if (!selectedRoomId) {
      setActiveDirectSlotId(null);
      return;
    }
    const directs = roomDirectSlots(selectedRoomId);
    if (directs.length === 0) {
      setActiveDirectSlotId(null);
      return;
    }
    setActiveDirectSlotId((cur) => {
      if (cur && directs.some((s) => s.id === cur)) return cur;
      return directs[0].id;
    });
  }, [selectedRoomId, selected.id, slots]);

  const openDirectSlotModal = (roomId: string) => {
    setDirectSlotModalRoomId(roomId);
    setDirectSlotModalDraft("");
    setDirectSlotModalOpen(true);
  };

  const submitDirectSlotModal = () => {
    if (!directSlotModalRoomId || !selected) return;
    const name = directSlotModalDraft.trim();
    if (!name) {
      toast({
        title: "이름을 입력하세요",
        description: "직속 보관 칸 이름을 적어 주세요.",
        variant: "warning",
      });
      return;
    }
    const id = newEntityId();
    const nextSort =
      Math.max(
        0,
        ...roomDirectSlots(directSlotModalRoomId).map((s) => s.sortOrder ?? 0),
      ) + 1;
    const row: StorageLocationRow = {
      id,
      name,
      roomId: directSlotModalRoomId,
      furniturePlacementId: null,
      sortOrder: nextSort,
    };
    거점을_갱신_한다(selected.id, (h) => ({
      ...h,
      storageLocations: [...(h.storageLocations ?? []), row],
    }));
    setActiveDirectSlotId(id);
    setDirectSlotModalOpen(false);
    setDirectSlotModalDraft("");
    setDirectSlotModalRoomId(null);
    toast({ title: "직속 칸이 추가되었습니다", description: name });
  };

  const handleAddFurnitureToSlot = (
    roomId: string,
    slotId: string,
    labelRaw: string,
  ): boolean => {
    const label = labelRaw.trim();
    if (!label) {
      toast({
        title: "가구 이름을 입력하세요",
        description: "모달에서 이름을 적고「추가」를 누르세요.",
        variant: "warning",
      });
      return false;
    }
    if (!roomDirectSlots(roomId).some((s) => s.id === slotId)) {
      toast({
        title: "직속 칸을 확인하세요",
        variant: "warning",
      });
      return false;
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
      anchorDirectStorageId: slotId,
    };
    거점을_갱신_한다(selected.id, (h) => ({
      ...h,
      furniturePlacements: [...(h.furniturePlacements ?? []), fp],
    }));
    toast({ title: "가구가 이 직속 칸에 연결되었습니다", description: label });
    return true;
  };

  const openFurnitureModal = (roomId: string, slotId: string) => {
    setFurnitureModalRoomId(roomId);
    setFurnitureModalSlotId(slotId);
    setFurnitureModalDraft("");
    setFurnitureModalOpen(true);
  };

  const submitFurnitureModal = () => {
    if (!furnitureModalRoomId || !furnitureModalSlotId || !selected) return;
    const label = furnitureModalDraft.trim();
    if (!label) {
      toast({
        title: "가구 이름을 입력하세요",
        description: "이름을 입력해 주세요.",
        variant: "warning",
      });
      return;
    }
    const ok = handleAddFurnitureToSlot(
      furnitureModalRoomId,
      furnitureModalSlotId,
      label,
    );
    if (!ok) return;
    setFurnitureModalOpen(false);
    setFurnitureModalDraft("");
    setFurnitureModalRoomId(null);
    setFurnitureModalSlotId(null);
  };

  const handleReanchorFurniture = (furnitureId: string, nextSlotId: string) => {
    const fp = placements.find((f) => f.id === furnitureId);
    if (!fp || fp.anchorDirectStorageId === nextSlotId) return;
    const ok = roomDirectSlots(fp.roomId).some((s) => s.id === nextSlotId);
    if (!ok) {
      toast({ title: "직속 칸을 확인하세요", variant: "warning" });
      return;
    }
    거점을_갱신_한다(selected.id, (h) => ({
      ...h,
      furniturePlacements: (h.furniturePlacements ?? []).map((f) =>
        f.id === furnitureId
          ? { ...f, anchorDirectStorageId: nextSlotId }
          : f,
      ),
    }));
  };

  const handleAddFurnitureSlot = (
    furnitureId: string,
    nameRaw: string,
  ): boolean => {
    const name = nameRaw.trim();
    if (!name) {
      toast({
        title: "칸 이름을 입력하세요",
        description: "모달에서 세부 칸 이름을 적고「추가」를 누르세요.",
        variant: "warning",
      });
      return false;
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
    toast({ title: "세부 보관 칸이 추가되었습니다", description: name });
    return true;
  };

  const openSubSlotModal = (furnitureId: string) => {
    setSubSlotModalFurnitureId(furnitureId);
    setSubSlotModalDraft("");
    setSubSlotModalOpen(true);
  };

  const submitSubSlotModal = () => {
    if (!subSlotModalFurnitureId || !selected) return;
    const name = subSlotModalDraft.trim();
    if (!name) {
      toast({
        title: "칸 이름을 입력하세요",
        description: "이름을 입력해 주세요.",
        variant: "warning",
      });
      return;
    }
    const ok = handleAddFurnitureSlot(subSlotModalFurnitureId, name);
    if (!ok) return;
    setSubSlotModalOpen(false);
    setSubSlotModalDraft("");
    setSubSlotModalFurnitureId(null);
  };

  const requestDeleteStorage = (storageId: string) => {
    const s = slots.find((x) => x.id === storageId);
    if (!s) return;
    const isRoomDirect =
      Boolean(s.roomId) &&
      (s.furniturePlacementId == null || s.furniturePlacementId === "");
    if (isRoomDirect && s.roomId) {
      const others = roomDirectSlots(s.roomId).filter((x) => x.id !== storageId);
      const anchored = furnitureOnSlot(s.roomId, storageId);
      if (anchored.length > 0 && others.length === 0) {
        toast({
          title: "이 칸은 지금 삭제할 수 없습니다",
          description:
            "연결된 가구가 있습니다. 다른 직속 칸을 먼저 만든 뒤 가구를 옮기거나 삭제하세요.",
          variant: "warning",
        });
        return;
      }
    }
    setPendingDelete({ kind: "storage", id: storageId });
  };

  const confirmDeleteStorage = (storageId: string) => {
    const victim = slots.find((x) => x.id === storageId);
    const roomId = victim?.roomId;
    const isRoomDirect =
      victim &&
      (victim.furniturePlacementId == null || victim.furniturePlacementId === "");

    거점을_갱신_한다(selected.id, (h) => {
      const allSlots = [...(h.storageLocations ?? [])];
      let nextFps = [...(h.furniturePlacements ?? [])];

      if (isRoomDirect && roomId) {
        const remaining = allSlots
          .filter(
            (x) =>
              x.id !== storageId &&
              x.roomId === roomId &&
              (x.furniturePlacementId == null || x.furniturePlacementId === ""),
          )
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        const fallback = remaining[0]?.id;
        nextFps = nextFps.map((f) =>
          f.anchorDirectStorageId === storageId
            ? { ...f, anchorDirectStorageId: fallback }
            : f,
        );
      }

      return {
        ...h,
        storageLocations: allSlots.filter((x) => x.id !== storageId),
        furniturePlacements: nextFps,
        items: h.items.filter((i) => i.storageLocationId !== storageId),
      };
    });
    toast({ title: "보관 칸이 삭제되었습니다", variant: "success" });
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
    toast({
      title: "가구 배치가 삭제되었습니다",
      description: "연결된 세부 칸·재고도 함께 정리되었습니다.",
      variant: "success",
    });
  };

  const pendingDescription = () => {
    if (!pendingDelete) return "";
    if (pendingDelete.kind === "storage") {
      const s = slots.find((x) => x.id === pendingDelete.id);
      return s
        ? `「${s.name}」을(를) 삭제합니다. 이 칸에만 있던 재고도 함께 제거됩니다.`
        : "삭제하시겠습니까?";
    }
    const f = placements.find((x) => x.id === pendingDelete.id);
    return f
      ? `「${f.label}」 가구를 삭제합니다. 그 아래 세부 칸과 재고도 함께 제거됩니다.`
      : "삭제하시겠습니까?";
  };

  const directModalRoomName =
    directSlotModalRoomId != null
      ? (selected.rooms.find((r) => r.id === directSlotModalRoomId)?.name ?? "")
      : "";

  const furnitureModalRoomName =
    furnitureModalRoomId != null
      ? (selected.rooms.find((r) => r.id === furnitureModalRoomId)?.name ?? "")
      : "";
  const furnitureModalSlotName =
    furnitureModalSlotId != null
      ? (slots.find((s) => s.id === furnitureModalSlotId)?.name ?? "")
      : "";
  const subSlotModalFurnitureLabel =
    subSlotModalFurnitureId != null
      ? (placements.find((f) => f.id === subSlotModalFurnitureId)?.label ?? "")
      : "";

  return (
    <div className="cursor-default rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      <button
        type="button"
        title="오른쪽 아래 물품 추가 패널을 펼칩니다"
        className="-mx-1 -mt-1 w-full !cursor-default rounded-xl px-1 py-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
        onClick={() => onFocusItemAddPanel?.()}
      >
        <h2 className="text-base font-semibold text-white">
          가구 배치 · 보관 장소
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          <span className="text-zinc-400">직속 칸</span>마다 탭으로 나뉩니다.
          탭을 고른 뒤 그 칸에만 가구·세부 칸을 추가하세요. 새 직속 칸은「직속
          칸 추가하기」로 만듭니다.
        </p>
        <p className="mt-2 text-[11px] text-teal-500/75">
          이 제목 영역을 누르면 오른쪽「물품 추가」패널이 펼쳐집니다.
        </p>
      </button>

      {selected.rooms.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-zinc-700 px-4 py-6 text-center text-sm text-zinc-500">
          먼저 방을 추가한 뒤, 방을 선택하면 이 영역에서 구조를 입력할 수
          있습니다.
        </p>
      ) : selectedRoomId == null ? (
        <p className="mt-4 rounded-xl border border-dashed border-zinc-700 px-4 py-6 text-center text-sm text-zinc-500">
          왼쪽「방 관리」에서 방 탭을 눌러 선택하세요. 선택한 방의 구조만
          여기에 표시됩니다.
        </p>
      ) : visibleRooms.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 px-4 py-6 text-center text-sm text-amber-200/90">
          선택한 방을 찾을 수 없습니다. 방 목록이 바뀌었다면 다시 선택해 주세요.
        </p>
      ) : (
        <ul className="mt-4 space-y-6">
          {visibleRooms.map((room) => {
            const directs = roomDirectSlots(room.id);
            const multiSlot = directs.length > 1;
            const activeSlot =
              activeDirectSlotId != null
                ? directs.find((s) => s.id === activeDirectSlotId)
                : undefined;

            return (
              <li key={room.id} className="rounded-xl">
                <h3 className="text-sm font-semibold text-teal-200/95">
                  {room.name}
                </h3>

                {directs.length === 0 ? (
                  <div className="mt-4 space-y-3">
                    <p className="rounded-lg border border-dashed border-zinc-700/80 bg-zinc-900/30 px-3 py-4 text-center text-xs text-zinc-500">
                      직속 칸이 없습니다. 아래 버튼으로 첫 칸을 만드세요.
                    </p>
                    <button
                      type="button"
                      className={`${btnAddDirectSlot} w-full sm:w-auto`}
                      onClick={() => openDirectSlotModal(room.id)}
                    >
                      직속 칸 추가하기
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                      <div
                        className="min-w-0 flex-1"
                        role="tablist"
                        aria-label="직속 보관 칸"
                      >
                        
                        <div className="flex flex-wrap gap-1 border-b border-zinc-800 pb-px">
                          {directs.map((s) => {
                            const selectedTab = s.id === activeSlot?.id;
                            return (
                              <button
                                key={s.id}
                                type="button"
                                role="tab"
                                aria-selected={selectedTab}
                                className={cn(
                                  "cursor-pointer rounded-t-lg border border-b-0 px-3 py-2 text-xs font-medium transition-colors",
                                  selectedTab
                                    ? "border-amber-500/40 bg-amber-950/30 text-amber-100"
                                    : "border-transparent bg-transparent text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300",
                                )}
                                onClick={() => setActiveDirectSlotId(s.id)}
                              >
                                {s.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <button
                        type="button"
                        className={`${btnAddDirectSlot} shrink-0 self-stretch sm:self-auto`}
                        onClick={() => openDirectSlotModal(room.id)}
                      >
                        직속 칸 추가하기
                      </button>
                    </div>

                    {activeSlot ? (
                      <div
                        className="mt-4 rounded-xl border border-amber-500/30 bg-zinc-900/40 p-4"
                        role="tabpanel"
                        aria-labelledby={`tab-${activeSlot.id}`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-amber-500/20 pb-3">
                          <div>
                            <p className="text-[10px] font-medium text-amber-200/85">
                              현재 직속 칸
                            </p>
                            <p
                              id={`tab-${activeSlot.id}`}
                              className="text-base font-semibold text-zinc-100"
                            >
                              {activeSlot.name}
                            </p>
                          </div>
                          <button
                            type="button"
                            className={btnDangerIcon}
                            title="이 직속 칸과 이 칸에만 묶인 설정을 삭제합니다"
                            aria-label={`「${activeSlot.name}」 직속 칸 삭제`}
                            onClick={() => requestDeleteStorage(activeSlot.id)}
                          >
                            <TrashIcon />
                          </button>
                        </div>

                        <div className="mt-4">
                          <p className="mt-1 text-sm text-zinc-500">
                            <span className="text-zinc-400">「가구 추가」</span>
                            로 모달을 열어 이 탭(
                            <span className="text-zinc-400">직속 칸</span>
                            )에만 가구를 연결합니다.
                          </p>
                          <ul className="mt-3 space-y-3">
                            {furnitureOnSlot(room.id, activeSlot.id).length ===
                            0 ? (
                              <li className="rounded-lg bg-zinc-950/40 px-2 py-2 text-xs text-zinc-600">
                                아직 가구가 없습니다.
                              </li>
                            ) : (
                              furnitureOnSlot(room.id, activeSlot.id).map(
                                (fp) => (
                                  <li
                                    key={fp.id}
                                    className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3"
                                  >
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                      <p className="text-sm font-semibold text-zinc-100">
                                        {fp.label}
                                      </p>
                                      <button
                                        type="button"
                                        className={`${btnDangerIcon} shrink-0`}
                                        title="이 가구와 그 아래 세부 칸·재고를 삭제합니다"
                                        aria-label={`「${fp.label}」 가구 삭제`}
                                        onClick={() =>
                                          setPendingDelete({
                                            kind: "furniture",
                                            id: fp.id,
                                          })
                                        }
                                      >
                                        <TrashIcon />
                                      </button>
                                    </div>

                                    {multiSlot ? (
                                      <div className="mt-3 space-y-1">
                                        <label
                                          className="text-[10px] text-zinc-500"
                                          htmlFor={`reanchor-${fp.id}`}
                                        >
                                          다른 직속 칸 탭으로 옮기기
                                        </label>
                                        <select
                                          id={`reanchor-${fp.id}`}
                                          className={selectClass}
                                          value={
                                            fp.anchorDirectStorageId ??
                                            activeSlot.id
                                          }
                                          onChange={(e) =>
                                            handleReanchorFurniture(
                                              fp.id,
                                              e.target.value,
                                            )
                                          }
                                        >
                                          {directs.map((s) => (
                                            <option key={s.id} value={s.id}>
                                              {s.name}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    ) : null}

                                    <div className="mt-3 border-t border-zinc-800/70 pt-3">
                                      <p className="mt-1 text-sm text-zinc-500">
                                        <span className="text-zinc-400">
                                          물품 등록
                                        </span>
                                        시{" "}
                                        <span className="text-zinc-400">
                                          여기서 만든 칸
                                        </span>
                                        까지 고를 수 있습니다.
                                      </p>
                                      <ul className="mt-3 space-y-1.5">
                                        {slotsUnderFurniture(fp.id).length ===
                                        0 ? (
                                          <li className="text-xs text-zinc-600">
                                            세부 칸이 없습니다.
                                          </li>
                                        ) : (
                                          slotsUnderFurniture(fp.id).map(
                                            (s) => (
                                              <li
                                                key={s.id}
                                                className="flex items-center justify-between gap-2 rounded-md bg-zinc-900/80 px-2 py-1.5 text-xs text-zinc-300"
                                              >
                                                <span>{s.name}</span>
                                                <button
                                                  type="button"
                                                  className={`${btnDangerIcon} shrink-0`}
                                                  title="이 세부 칸과 이 칸에만 묶인 재고를 삭제합니다"
                                                  aria-label={`「${s.name}」 세부 칸 삭제`}
                                                  onClick={() =>
                                                    requestDeleteStorage(s.id)
                                                  }
                                                >
                                                  <TrashIcon />
                                                </button>
                                              </li>
                                            ),
                                          )
                                        )}
                                      </ul>
                                      <div className="mt-2">
                                        <button
                                          type="button"
                                          className={`${btnAdd} w-full sm:w-auto`}
                                          onClick={() =>
                                            openSubSlotModal(fp.id)
                                          }
                                        >
                                          세부 칸 추가
                                        </button>
                                      </div>
                                    </div>
                                  </li>
                                ),
                              )
                            )}
                          </ul>
                        </div>

                        <div className="mt-4 border-t border-zinc-800/70 pt-3">
                          <p className="mb-2 text-[11px] font-medium text-zinc-400">
                            「{activeSlot.name}」에 가구 연결
                          </p>
                          <button
                            type="button"
                            className={`${btnAdd} w-full sm:w-auto`}
                            onClick={() =>
                              openFurnitureModal(room.id, activeSlot.id)
                            }
                          >
                            가구 추가
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <FormModal
        open={directSlotModalOpen}
        onOpenChange={(open) => {
          setDirectSlotModalOpen(open);
          if (!open) {
            setDirectSlotModalDraft("");
            setDirectSlotModalRoomId(null);
          }
        }}
        title="직속 보관 칸 추가"
        description={
          directModalRoomName
            ? `「${directModalRoomName}」에 붙는 보관 블록 이름을 정합니다. (예: 냉장고, 벽면장)`
            : "보관 블록 이름을 정합니다."
        }
        submitLabel="추가"
        cancelLabel="취소"
        submitDisabled={!directSlotModalDraft.trim()}
        onSubmit={submitDirectSlotModal}
      >
        <label className="block text-xs font-medium text-zinc-500">
          칸 이름
        </label>
        <input
          value={directSlotModalDraft}
          onChange={(e) => setDirectSlotModalDraft(e.target.value)}
          placeholder="예: 냉장고, 벽면장"
          className={`${inputClass} mt-1`}
          autoFocus
        />
      </FormModal>

      <FormModal
        open={furnitureModalOpen}
        onOpenChange={(open) => {
          setFurnitureModalOpen(open);
          if (!open) {
            setFurnitureModalDraft("");
            setFurnitureModalRoomId(null);
            setFurnitureModalSlotId(null);
          }
        }}
        title="가구 연결"
        description={
          furnitureModalRoomName && furnitureModalSlotName
            ? `「${furnitureModalRoomName}」의 직속 칸「${furnitureModalSlotName}」에 붙일 가구 이름을 정합니다.`
            : "직속 칸에 붙일 가구 이름을 입력합니다."
        }
        submitLabel="추가"
        cancelLabel="취소"
        submitDisabled={!furnitureModalDraft.trim()}
        onSubmit={submitFurnitureModal}
      >
        <label className="block text-xs font-medium text-zinc-500">
          가구 이름
        </label>
        <input
          value={furnitureModalDraft}
          onChange={(e) => setFurnitureModalDraft(e.target.value)}
          placeholder="예: 주방 선반"
          className={`${inputClass} mt-1`}
          autoFocus
        />
      </FormModal>

      <FormModal
        open={subSlotModalOpen}
        onOpenChange={(open) => {
          setSubSlotModalOpen(open);
          if (!open) {
            setSubSlotModalDraft("");
            setSubSlotModalFurnitureId(null);
          }
        }}
        title="세부 보관 칸 추가"
        description={
          subSlotModalFurnitureLabel
            ? `「${subSlotModalFurnitureLabel}」 아래에 나눌 보관 칸 이름을 정합니다.`
            : "가구 아래 세부 칸 이름을 입력합니다."
        }
        submitLabel="추가"
        cancelLabel="취소"
        submitDisabled={!subSlotModalDraft.trim()}
        onSubmit={submitSubSlotModal}
      >
        <label className="block text-xs font-medium text-zinc-500">
          세부 칸 이름
        </label>
        <input
          value={subSlotModalDraft}
          onChange={(e) => setSubSlotModalDraft(e.target.value)}
          placeholder="예: 서랍 왼쪽"
          className={`${inputClass} mt-1`}
          autoFocus
        />
      </FormModal>

      <AlertModal
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={
          pendingDelete?.kind === "furniture"
            ? "가구 삭제"
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
