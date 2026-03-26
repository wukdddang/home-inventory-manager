"use client";

import { AlertModal } from "@/app/_ui/alert-modal";
import { FormModal } from "@/app/_ui/form-modal";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useMemo, useState } from "react";
import { useDashboard } from "../../_hooks/useDashboard";
import { newEntityId } from "../../_lib/dashboard-helpers";
import type {
  FurniturePlacement,
  Household,
  StorageLocationRow,
} from "@/types/domain";

const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500";

const selectClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500";

/** 주요 추가 동작 — 틸(가구·세부 보관 장소·옮기기) */
const btnAdd =
  "inline-flex cursor-pointer shrink-0 items-center justify-center gap-1 rounded-md border border-teal-600/60 bg-teal-950/40 px-2 py-0.5 text-xs font-medium leading-tight text-teal-100 hover:bg-teal-900/35";

/** 직속 보관 장소 추가 — 직속 탭·패널과 동일 앰버 톤 */
const btnAddDirectSlot =
  "inline-flex cursor-pointer shrink-0 items-center justify-center gap-1 rounded-md border border-amber-500/45 bg-amber-950/35 px-2 py-0.5 text-xs font-medium leading-tight text-amber-100/95 hover:border-amber-400/55 hover:bg-amber-500/[0.12]";

const btnDangerIcon =
  "inline-flex cursor-pointer items-center justify-center rounded-md border border-rose-900/50 p-1.5 text-rose-400 hover:bg-rose-950/40";

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={cn("size-3.5", className)}
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

function PlusMiniIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={cn("size-3 shrink-0", className)}
      aria-hidden
    >
      <path strokeLinecap="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function ArrowsRightLeftMiniIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={cn("size-3 shrink-0", className)}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
      />
    </svg>
  );
}

function PlacementsFurnitureIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={cn("size-4 shrink-0 text-teal-400/90", className)}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5v9l9 5.25m0-9v9"
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
  /** 제목 클릭 시 오른쪽 재고 추가 패널을 펼치고 스크롤 */
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
  /** 사용자가 탭으로 고른 직속 보관 장소(없거나 무효하면 아래 파생 id로 폴백) */
  const [userDirectSlotPick, setUserDirectSlotPick] = useState<string | null>(
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
  /** 직속 보관 장소 하위 가구 중 한 번에 하나만 펼쳐 볼 때 선택한 가구 id */
  const [focusedFurnitureId, setFocusedFurnitureId] = useState<string | null>(
    null,
  );

  const [reanchorModalOpen, setReanchorModalOpen] = useState(false);
  const [reanchorModalFurnitureId, setReanchorModalFurnitureId] = useState<
    string | null
  >(null);
  const [reanchorModalTargetSlotId, setReanchorModalTargetSlotId] =
    useState("");

  const directsForSelectedRoom = useMemo(() => {
    if (!selected || !selectedRoomId) return [];
    const slotsList = selected.storageLocations ?? [];
    return slotsList
      .filter(
        (s) =>
          s.roomId === selectedRoomId &&
          (s.furniturePlacementId == null || s.furniturePlacementId === ""),
      )
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [selected, selectedRoomId]);

  const resolvedDirectSlotId = useMemo(() => {
    if (directsForSelectedRoom.length === 0) return null;
    if (
      userDirectSlotPick &&
      directsForSelectedRoom.some((s) => s.id === userDirectSlotPick)
    ) {
      return userDirectSlotPick;
    }
    return directsForSelectedRoom[0].id;
  }, [directsForSelectedRoom, userDirectSlotPick]);

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
    furnitureInRoom(roomId).filter((f) => f.anchorDirectStorageId === slotId);

  const slotsUnderFurniture = (furnitureId: string) =>
    slots.filter((s) => s.furniturePlacementId === furnitureId);

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
        description: "직속 보관 장소 이름을 적어 주세요.",
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
    setUserDirectSlotPick(id);
    setDirectSlotModalOpen(false);
    setDirectSlotModalDraft("");
    setDirectSlotModalRoomId(null);
    toast({ title: "직속 보관 장소가 추가되었습니다", description: name });
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
        title: "직속 보관 장소를 확인하세요",
        variant: "warning",
      });
      return false;
    }
    const id = newEntityId();
    const inRoom = furnitureInRoom(roomId);
    const nextSort = Math.max(0, ...inRoom.map((f) => f.sortOrder ?? 0)) + 1;
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
    setFocusedFurnitureId(id);
    toast({ title: "가구가 이 직속 보관 장소에 연결되었습니다", description: label });
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

  const handleReanchorFurniture = (
    furnitureId: string,
    nextSlotId: string,
  ): boolean => {
    const fp = placements.find((f) => f.id === furnitureId);
    if (!fp || fp.anchorDirectStorageId === nextSlotId) return false;
    const ok = roomDirectSlots(fp.roomId).some((s) => s.id === nextSlotId);
    if (!ok) {
      toast({ title: "직속 보관 장소를 확인하세요", variant: "warning" });
      return false;
    }
    거점을_갱신_한다(selected.id, (h) => ({
      ...h,
      furniturePlacements: (h.furniturePlacements ?? []).map((f) =>
        f.id === furnitureId ? { ...f, anchorDirectStorageId: nextSlotId } : f,
      ),
    }));
    return true;
  };

  const openReanchorModal = (furnitureId: string) => {
    const fp = placements.find((f) => f.id === furnitureId);
    if (!fp) return;
    const dirs = roomDirectSlots(fp.roomId);
    const cur = fp.anchorDirectStorageId ?? "";
    const defaultTarget =
      dirs.find((s) => s.id !== cur)?.id ?? dirs[0]?.id ?? "";
    setReanchorModalFurnitureId(furnitureId);
    setReanchorModalTargetSlotId(defaultTarget);
    setReanchorModalOpen(true);
  };

  const submitReanchorModal = () => {
    if (!reanchorModalFurnitureId || !reanchorModalTargetSlotId) return;
    const fp = placements.find((f) => f.id === reanchorModalFurnitureId);
    if (!fp) return;
    if (fp.anchorDirectStorageId === reanchorModalTargetSlotId) {
      toast({
        title: "다른 직속 보관 장소를 선택하세요",
        description: "옮기려면 현재와 다른 보관 장소를 고릅니다.",
        variant: "warning",
      });
      return;
    }
    const ok = handleReanchorFurniture(
      reanchorModalFurnitureId,
      reanchorModalTargetSlotId,
    );
    if (ok) {
      setReanchorModalOpen(false);
      setReanchorModalFurnitureId(null);
      setReanchorModalTargetSlotId("");
      toast({
        title: "가구를 옮겼습니다",
        description: `「${fp.label}」연결을 바꿨습니다.`,
        variant: "success",
      });
    }
  };

  const handleAddFurnitureSlot = (
    furnitureId: string,
    nameRaw: string,
  ): boolean => {
    const name = nameRaw.trim();
    if (!name) {
      toast({
        title: "보관 장소 이름을 입력하세요",
        description: "모달에서 세부 보관 장소 이름을 적고「추가」를 누르세요.",
        variant: "warning",
      });
      return false;
    }
    const id = newEntityId();
    const under = slotsUnderFurniture(furnitureId);
    const nextSort = Math.max(0, ...under.map((s) => s.sortOrder ?? 0)) + 1;
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
    toast({ title: "세부 보관 장소가 추가되었습니다", description: name });
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
        title: "보관 장소 이름을 입력하세요",
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
      const others = roomDirectSlots(s.roomId).filter(
        (x) => x.id !== storageId,
      );
      const anchored = furnitureOnSlot(s.roomId, storageId);
      if (anchored.length > 0 && others.length === 0) {
        toast({
          title: "이 보관 장소는 지금 삭제할 수 없습니다",
          description:
            "연결된 가구가 있습니다. 다른 직속 보관 장소를 먼저 만든 뒤 가구를 옮기거나 삭제하세요.",
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
      (victim.furniturePlacementId == null ||
        victim.furniturePlacementId === "");

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
    toast({ title: "보관 장소가 삭제되었습니다", variant: "success" });
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
      title: "가구가 삭제되었습니다",
      description: "연결된 세부 보관 장소·재고도 함께 정리되었습니다.",
      variant: "success",
    });
  };

  const reanchorModalFurniture = reanchorModalFurnitureId
    ? placements.find((f) => f.id === reanchorModalFurnitureId)
    : null;
  const reanchorModalDirects = reanchorModalFurniture
    ? roomDirectSlots(reanchorModalFurniture.roomId)
    : [];

  const pendingDescription = () => {
    if (!pendingDelete) return "";
    if (pendingDelete.kind === "storage") {
      const s = slots.find((x) => x.id === pendingDelete.id);
      return s
        ? `「${s.name}」을(를) 삭제합니다. 이 보관 장소에만 있던 재고도 함께 제거됩니다.`
        : "삭제하시겠습니까?";
    }
    const f = placements.find((x) => x.id === pendingDelete.id);
    return f
      ? `「${f.label}」 가구를 삭제합니다. 그 아래 세부 보관 장소와 재고도 함께 제거됩니다.`
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
    <div className="cursor-default rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <button
        type="button"
        title="오른쪽 아래 재고 추가 패널을 펼칩니다"
        className="-mx-1 -mt-1 w-full cursor-default! rounded-lg px-1 py-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
        onClick={() => onFocusItemAddPanel?.()}
      >
        <h2 className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-white">
          <PlacementsFurnitureIcon />
          가구 · 보관 장소
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-zinc-300">
          <span className="text-zinc-300">직속 보관 장소</span>마다 탭으로 나뉩니다.
          탭을 고른 뒤 그 보관 장소에만 가구·세부 보관 장소를 추가하세요. 새 직속 보관 장소는「직속
          보관 장소 추가하기」로 만듭니다.
        </p>
        <p className="mt-1.5 text-xs text-teal-500/75">
          이 제목 영역을 누르면 오른쪽「재고 추가」패널이 펼쳐집니다.
        </p>
      </button>

      {selected.rooms.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-zinc-700 px-3 py-4 text-center text-xs text-zinc-300">
          먼저 방을 추가한 뒤, 방을 선택하면 이 영역에서 구조를 입력할 수
          있습니다.
        </p>
      ) : selectedRoomId == null ? (
        <p className="mt-3 rounded-lg border border-dashed border-zinc-700 px-3 py-4 text-center text-xs text-zinc-300">
          왼쪽「방 관리」에서 방 탭을 눌러 선택하세요. 선택한 방의 구조만 여기에
          표시됩니다.
        </p>
      ) : visibleRooms.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-amber-500/30 bg-amber-500/5 px-3 py-4 text-center text-xs text-amber-200/90">
          선택한 방을 찾을 수 없습니다. 방 목록이 바뀌었다면 다시 선택해 주세요.
        </p>
      ) : (
        <ul className="mt-3 space-y-4">
          {visibleRooms.map((room) => {
            const directs = roomDirectSlots(room.id);
            const multiSlot = directs.length > 1;
            const activeSlot =
              resolvedDirectSlotId != null
                ? directs.find((s) => s.id === resolvedDirectSlotId)
                : undefined;
            const fpsForSlot = activeSlot
              ? furnitureOnSlot(room.id, activeSlot.id)
              : [];
            const focusedFurniture =
              fpsForSlot.length === 0
                ? null
                : focusedFurnitureId != null &&
                    fpsForSlot.some((f) => f.id === focusedFurnitureId)
                  ? fpsForSlot.find((f) => f.id === focusedFurnitureId)!
                  : fpsForSlot[0];

            return (
              <li key={room.id} className="rounded-xl">
                <h3 className="text-xs font-semibold text-teal-200/95">
                  {room.name}
                </h3>

                {directs.length === 0 ? (
                  <div className="mt-4 space-y-3">
                    <p className="rounded-lg border border-dashed border-zinc-700/80 bg-zinc-900/30 px-3 py-4 text-center text-xs text-zinc-300">
                      직속 보관 장소가 없습니다. 아래 버튼으로 첫 보관 장소를 만드세요.
                    </p>
                    <button
                      type="button"
                      className={`${btnAddDirectSlot} w-full sm:w-auto`}
                      onClick={() => openDirectSlotModal(room.id)}
                    >
                      <PlusMiniIcon />
                      직속 보관 장소 추가하기
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                      <div
                        className="min-w-0 flex-1"
                        role="tablist"
                        aria-label="직속 보관 장소"
                      >
                        <div className="flex flex-wrap gap-1 border-b border-zinc-800 pb-px">
                          {directs.map((s) => {
                            const selectedTab = s.id === activeSlot?.id;
                            return (
                              <div
                                key={s.id}
                                className={cn(
                                  "flex shrink-0 items-stretch overflow-hidden rounded-t-md border border-b-0",
                                  selectedTab
                                    ? "border-amber-500/40 bg-amber-950/30"
                                    : "border-transparent hover:border-zinc-700/60",
                                )}
                              >
                                <button
                                  type="button"
                                  role="tab"
                                  aria-selected={selectedTab}
                                  className={cn(
                                    "cursor-pointer px-2 py-1.5 text-left text-xs font-medium transition-colors",
                                    selectedTab
                                      ? "text-amber-100"
                                      : "text-zinc-300 hover:bg-zinc-800/40 hover:text-zinc-300",
                                  )}
                                  onClick={() => setUserDirectSlotPick(s.id)}
                                >
                                  <span className="whitespace-nowrap">
                                    {s.name}
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  className={cn(
                                    "relative z-10 flex cursor-pointer items-center justify-center p-1.5 transition-colors",
                                    selectedTab
                                      ? "text-amber-200/75 hover:bg-rose-500/20 hover:text-rose-300"
                                      : "text-zinc-300 hover:bg-zinc-800/70 hover:text-rose-300",
                                  )}
                                  title="이 직속 보관 장소와 여기에만 묶인 설정을 삭제합니다"
                                  aria-label={`「${s.name}」 직속 보관 장소 삭제`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    requestDeleteStorage(s.id);
                                  }}
                                >
                                  <TrashIcon />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <button
                        type="button"
                        className={`${btnAddDirectSlot} shrink-0 self-stretch sm:self-auto`}
                        onClick={() => openDirectSlotModal(room.id)}
                      >
                        <PlusMiniIcon />
                        직속 보관 장소 추가하기
                      </button>
                    </div>

                    {activeSlot ? (
                      <div
                        className="mt-3 rounded-lg border border-amber-500/30 bg-zinc-900/40 p-3"
                        role="tabpanel"
                        aria-labelledby={`tab-${activeSlot.id}`}
                      >
                        <div className="border-b border-amber-500/20 pb-2">
                          <p className="text-xs font-medium text-amber-200/85">
                            현재 직속 보관 장소
                          </p>
                          <p
                            id={`tab-${activeSlot.id}`}
                            className="text-sm font-semibold text-zinc-100"
                          >
                            {activeSlot.name}
                          </p>
                        </div>

                        <div className="mt-3">
                          <p className="text-xs text-zinc-300">
                            이 직속 보관 장소에 붙은 가구는 아래 뱃지로 고르면 한 번에
                            하나의 상세만 펼쳐집니다.
                          </p>

                          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
                            <div className="min-w-0 flex-1 space-y-2">
                              <p className="text-xs font-medium text-zinc-300">
                                「{activeSlot.name}」에 가구 연결
                              </p>
                              {fpsForSlot.length === 0 ? (
                                <p className="rounded-md bg-zinc-950/40 px-2 py-1.5 text-xs text-zinc-300">
                                  아직 가구가 없습니다.
                                </p>
                              ) : (
                                <div
                                  className="flex flex-wrap gap-1.5"
                                  role="tablist"
                                  aria-label="이 직속 보관 장소의 가구"
                                >
                                  {fpsForSlot.map((fp) => {
                                    const sel = focusedFurniture?.id === fp.id;
                                    return (
                                      <button
                                        key={fp.id}
                                        type="button"
                                        role="tab"
                                        aria-selected={sel}
                                        onClick={() =>
                                          setFocusedFurnitureId(fp.id)
                                        }
                                        className={cn(
                                          "max-w-full cursor-pointer truncate rounded-full border px-2 py-0.5 text-xs font-medium transition-colors",
                                          sel
                                            ? "border-teal-500/50 bg-teal-950/40 text-teal-100"
                                            : "border-zinc-700 bg-zinc-950/80 text-zinc-300 hover:border-zinc-600 hover:text-zinc-200",
                                        )}
                                      >
                                        {fp.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              className={`${btnAdd} shrink-0 self-start sm:self-end`}
                              onClick={() =>
                                openFurnitureModal(room.id, activeSlot.id)
                              }
                            >
                              <PlusMiniIcon />
                              가구 추가
                            </button>
                          </div>

                          {fpsForSlot.length > 0 && focusedFurniture ? (
                            <ul className="mt-3 space-y-3">
                                  <li
                                    key={focusedFurniture.id}
                                    className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-2.5"
                                  >
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                                        <p className="text-xs font-semibold text-zinc-100">
                                          {focusedFurniture.label}
                                        </p>
                                        {multiSlot ? (
                                          <button
                                            type="button"
                                            className={`${btnAdd} shrink-0`}
                                            onClick={() =>
                                              openReanchorModal(
                                                focusedFurniture.id,
                                              )
                                            }
                                          >
                                            <ArrowsRightLeftMiniIcon />
                                            다른 직속 보관 장소로 옮기기
                                          </button>
                                        ) : null}
                                      </div>
                                      <button
                                        type="button"
                                        className={`${btnDangerIcon} shrink-0`}
                                        title="이 가구와 그 아래 세부 보관 장소·재고를 삭제합니다"
                                        aria-label={`「${focusedFurniture.label}」 가구 삭제`}
                                        onClick={() =>
                                          setPendingDelete({
                                            kind: "furniture",
                                            id: focusedFurniture.id,
                                          })
                                        }
                                      >
                                        <TrashIcon />
                                      </button>
                                    </div>

                                    <div className="mt-2 border-t border-zinc-800/70 pt-2">
                                      <p className="text-xs text-zinc-300">
                                        <span className="text-zinc-300">
                                          재고 등록
                                        </span>
                                        시{" "}
                                        <span className="text-zinc-300">
                                          여기서 만든 보관 장소
                                        </span>
                                        까지 고를 수 있습니다.
                                      </p>
                                      <ul className="mt-2 space-y-1">
                                        {slotsUnderFurniture(
                                          focusedFurniture.id,
                                        ).length === 0 ? (
                                          <li className="text-xs text-zinc-300">
                                            세부 보관 장소가 없습니다.
                                          </li>
                                        ) : (
                                          slotsUnderFurniture(
                                            focusedFurniture.id,
                                          ).map((s) => (
                                            <li
                                              key={s.id}
                                              className="flex items-center justify-between gap-2 rounded-md bg-zinc-900/80 px-2 py-1 text-xs text-zinc-300"
                                            >
                                              <span>{s.name}</span>
                                              <button
                                                type="button"
                                                className={`${btnDangerIcon} shrink-0`}
                                                title="이 세부 보관 장소와 여기에만 묶인 재고를 삭제합니다"
                                                aria-label={`「${s.name}」 세부 보관 장소 삭제`}
                                                onClick={() =>
                                                  requestDeleteStorage(s.id)
                                                }
                                              >
                                                <TrashIcon />
                                              </button>
                                            </li>
                                          ))
                                        )}
                                      </ul>
                                      <div className="mt-1.5">
                                        <button
                                          type="button"
                                          className={`${btnAdd} w-full sm:w-auto`}
                                          onClick={() =>
                                            openSubSlotModal(
                                              focusedFurniture.id,
                                            )
                                          }
                                        >
                                          <PlusMiniIcon />
                                          세부 보관 장소 추가
                                        </button>
                                      </div>
                                    </div>
                                  </li>
                                </ul>
                          ) : null}
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
        title="직속 보관 장소 추가"
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
        <label className="block text-xs font-medium text-zinc-300">
          보관 장소 이름
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
            ? `「${furnitureModalRoomName}」의 직속 보관 장소「${furnitureModalSlotName}」에 붙일 가구 이름을 정합니다.`
            : "직속 보관 장소에 붙일 가구 이름을 입력합니다."
        }
        submitLabel="추가"
        cancelLabel="취소"
        submitDisabled={!furnitureModalDraft.trim()}
        onSubmit={submitFurnitureModal}
      >
        <label className="block text-xs font-medium text-zinc-300">
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
        title="세부 보관 장소 추가"
        description={
          subSlotModalFurnitureLabel
            ? `「${subSlotModalFurnitureLabel}」 아래에 나눌 보관 장소 이름을 정합니다.`
            : "가구 아래 세부 보관 장소 이름을 입력합니다."
        }
        submitLabel="추가"
        cancelLabel="취소"
        submitDisabled={!subSlotModalDraft.trim()}
        onSubmit={submitSubSlotModal}
      >
        <label className="block text-xs font-medium text-zinc-300">
          세부 보관 장소 이름
        </label>
        <input
          value={subSlotModalDraft}
          onChange={(e) => setSubSlotModalDraft(e.target.value)}
          placeholder="예: 서랍 왼쪽"
          className={`${inputClass} mt-1`}
          autoFocus
        />
      </FormModal>

      <FormModal
        open={reanchorModalOpen}
        onOpenChange={(open) => {
          setReanchorModalOpen(open);
          if (!open) {
            setReanchorModalFurnitureId(null);
            setReanchorModalTargetSlotId("");
          }
        }}
        title="다른 직속 보관 장소로 옮기기"
        description={
          reanchorModalFurniture
            ? `「${reanchorModalFurniture.label}」가 붙어 있는 직속 보관 장소를 바꿉니다.`
            : "가구가 연결될 직속 보관 장소를 고릅니다."
        }
        submitLabel="옮기기"
        cancelLabel="취소"
        submitDisabled={
          !reanchorModalTargetSlotId ||
          (reanchorModalFurniture != null &&
            reanchorModalTargetSlotId ===
              (reanchorModalFurniture.anchorDirectStorageId ?? ""))
        }
        onSubmit={submitReanchorModal}
      >
        <label
          className="block text-xs font-medium text-zinc-300"
          htmlFor="reanchor-modal-slot"
        >
          옮길 직속 보관 장소
        </label>
        <select
          id="reanchor-modal-slot"
          className={`${selectClass} mt-1`}
          value={reanchorModalTargetSlotId}
          onChange={(e) => setReanchorModalTargetSlotId(e.target.value)}
        >
          {reanchorModalDirects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </FormModal>

      <AlertModal
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={
          pendingDelete?.kind === "furniture" ? "가구 삭제" : "보관 장소 삭제"
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
