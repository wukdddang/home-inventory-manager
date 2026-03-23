"use client";

import { AlertModal } from "@/app/_ui/alert-modal";
import { MotionModalLayer } from "@/app/_ui/motion-modal-layer";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { Household, StorageLocationRow, StructureRoom } from "@/types/domain";
import { useEffect, useId, useState, type MouseEvent } from "react";
import { useDashboard } from "../../_hooks/useDashboard";
import { defaultRoomGrid, newEntityId } from "../../_lib/dashboard-helpers";

function RoomsSectionIcon({ className }: { className?: string }) {
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
        d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
      />
    </svg>
  );
}

type DashboardRoomsSectionProps = {
  selected: Household | null;
  selectedRoomId: string | null;
  onRoomSelect: (roomId: string | null) => void;
};

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

function PencilIcon({ className }: { className?: string }) {
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
        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
      />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={cn("size-4", className)}
      aria-hidden
    >
      <path strokeLinecap="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

export function DashboardRoomsSection({
  selected,
  selectedRoomId,
  onRoomSelect,
}: DashboardRoomsSectionProps) {
  const { 거점을_갱신_한다 } = useDashboard();
  const [addOpen, setAddOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editRoomId, setEditRoomId] = useState<string | null>(null);
  const [editRoomName, setEditRoomName] = useState("");
  const [pendingDeleteRoomId, setPendingDeleteRoomId] = useState<string | null>(
    null,
  );

  const addTitleId = useId().replace(/:/g, "");
  const addDescId = useId().replace(/:/g, "");
  const editTitleId = useId().replace(/:/g, "");
  const editDescId = useId().replace(/:/g, "");

  useEffect(() => {
    if (!addOpen) return;
    setNewRoomName("");
  }, [addOpen]);

  useEffect(() => {
    if (!editOpen || !editRoomId || !selected) return;
    const r = selected.rooms.find((x) => x.id === editRoomId);
    setEditRoomName(r?.name ?? "");
  }, [editOpen, editRoomId, selected]);

  if (!selected) return null;

  const handleAddRoom = () => {
    const label = newRoomName.trim() || `방 ${selected.rooms.length + 1}`;
    const grid = defaultRoomGrid(selected.rooms.length);
    const room: StructureRoom = {
      id: newEntityId(),
      name: label,
      ...grid,
    };
    const defaultSlot: StorageLocationRow = {
      id: `sl-default-${room.id}`,
      name: "방(기본)",
      roomId: room.id,
      furniturePlacementId: null,
      sortOrder: 0,
    };
    거점을_갱신_한다(selected.id, (h) => ({
      ...h,
      rooms: [...h.rooms, room],
      storageLocations: [...(h.storageLocations ?? []), defaultSlot],
    }));
    setAddOpen(false);
    onRoomSelect(room.id);
  };

  const handleSaveRoomName = () => {
    if (!editRoomId) return;
    const name = editRoomName.trim();
    if (!name) return;
    거점을_갱신_한다(selected.id, (h) => ({
      ...h,
      rooms: h.rooms.map((r) => (r.id === editRoomId ? { ...r, name } : r)),
    }));
    setEditOpen(false);
    setEditRoomId(null);
  };

  const openEditModal = (roomId: string, e: MouseEvent) => {
    e.stopPropagation();
    setEditRoomId(roomId);
    const r = selected.rooms.find((x) => x.id === roomId);
    setEditRoomName(r?.name ?? "");
    setEditOpen(true);
  };

  const confirmDeleteRoom = (roomId: string) => {
    const fpIdsInRoom = new Set(
      (selected.furniturePlacements ?? [])
        .filter((f) => f.roomId === roomId)
        .map((f) => f.id),
    );
    const storageIdsToRemove = new Set(
      (selected.storageLocations ?? [])
        .filter(
          (s) =>
            s.roomId === roomId ||
            (s.furniturePlacementId != null &&
              fpIdsInRoom.has(s.furniturePlacementId)),
        )
        .map((s) => s.id),
    );
    거점을_갱신_한다(selected.id, (h) => ({
      ...h,
      rooms: h.rooms.filter((r) => r.id !== roomId),
      furniturePlacements: (h.furniturePlacements ?? []).filter(
        (f) => f.roomId !== roomId,
      ),
      storageLocations: (h.storageLocations ?? []).filter(
        (s) => !storageIdsToRemove.has(s.id),
      ),
      items: h.items.filter((i) => {
        if (i.roomId === roomId) return false;
        if (
          i.storageLocationId &&
          storageIdsToRemove.has(i.storageLocationId)
        ) {
          return false;
        }
        return true;
      }),
    }));
    if (selectedRoomId === roomId) onRoomSelect(null);
    setEditOpen(false);
    setEditRoomId(null);
  };

  const pendingDeleteRoom = pendingDeleteRoomId
    ? selected.rooms.find((r) => r.id === pendingDeleteRoomId)
    : null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
        <RoomsSectionIcon />
        방 관리
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-zinc-500">
        탭으로 방을 선택하세요. 구조도에서도 같은 방이 선택됩니다. + 로 방을
        추가합니다.
      </p>

      <div className="mt-3 flex min-w-0 items-stretch gap-1.5">
        <div
          role="tablist"
          aria-label="방 선택"
          className="flex min-h-9 min-w-0 flex-1 items-center gap-0.5 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950/80 p-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {selected.rooms.length === 0 ? (
            <p className="px-2.5 py-1.5 text-xs text-zinc-500">
              등록된 방이 없습니다. 오른쪽 + 로 추가하세요.
            </p>
          ) : (
            selected.rooms.map((r) => {
              const isSelected = r.id === selectedRoomId;
              return (
                <div
                  key={r.id}
                  className="relative flex shrink-0 items-center overflow-hidden rounded-lg"
                >
                  {isSelected ? (
                    <motion.div
                      layoutId="dashboard-rooms-tab-selection"
                      className="pointer-events-none absolute inset-0 z-0 rounded-lg bg-teal-500/15 ring-1 ring-teal-500/50"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 520,
                        damping: 38,
                        mass: 0.85,
                      }}
                    />
                  ) : null}
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => onRoomSelect(r.id)}
                    className={cn(
                      "relative z-10 cursor-pointer px-2.5 py-1.5 text-left text-xs font-medium transition-colors",
                      isSelected
                        ? "text-teal-100"
                        : "text-zinc-300 hover:text-white",
                    )}
                  >
                    <span className="whitespace-nowrap">{r.name}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => openEditModal(r.id, e)}
                    className="relative z-10 cursor-pointer rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-teal-300"
                    aria-label={`${r.name} 이름 수정`}
                  >
                    <PencilIcon />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingDeleteRoomId(r.id);
                    }}
                    className="relative z-10 cursor-pointer rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-rose-500/15 hover:text-rose-300"
                    aria-label={`${r.name} 삭제`}
                  >
                    <TrashIcon />
                  </button>
                </div>
              );
            })
          )}
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-teal-500/40 bg-teal-500/10 text-teal-300 transition-colors hover:bg-teal-500/20 hover:text-teal-100"
          aria-label="방 추가"
        >
          <PlusIcon />
        </button>
      </div>

      <MotionModalLayer
        open={addOpen}
        onOpenChange={setAddOpen}
        closeOnOverlayClick
        panelClassName="fixed left-1/2 top-1/2 z-10041 w-[min(100vw-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 outline-none"
        ariaLabelledBy={addTitleId}
        ariaDescribedBy={addDescId}
      >
        <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-5 shadow-xl">
          <h2 id={addTitleId} className="text-base font-semibold text-white">
            방 추가
          </h2>
          <p id={addDescId} className="mt-1.5 text-xs text-zinc-400">
            방 이름을 입력하세요. 비워 두면 순서대로 기본 이름이 붙습니다.
          </p>
          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-400">방 이름</label>
              <input
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="거실, 주방…"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                className="cursor-pointer rounded-lg border border-zinc-600 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
                onClick={() => setAddOpen(false)}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleAddRoom}
                className="cursor-pointer rounded-lg bg-teal-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-teal-400"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      </MotionModalLayer>

      <MotionModalLayer
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) setEditRoomId(null);
        }}
        closeOnOverlayClick
        panelClassName="fixed left-1/2 top-1/2 z-10041 w-[min(100vw-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 outline-none"
        ariaLabelledBy={editTitleId}
        ariaDescribedBy={editDescId}
      >
        <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-5 shadow-xl">
          <h2 id={editTitleId} className="text-base font-semibold text-white">
            방 이름 수정
          </h2>
          <p id={editDescId} className="mt-1.5 text-xs text-zinc-400">
            구조도·목록에 표시되는 이름을 바꿉니다.
          </p>
          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-400">방 이름</label>
              <input
                value={editRoomName}
                onChange={(e) => setEditRoomName(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                className="cursor-pointer rounded-lg border border-zinc-600 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
                onClick={() => setEditOpen(false)}
              >
                취소
              </button>
              <button
                type="button"
                disabled={!editRoomName.trim()}
                onClick={handleSaveRoomName}
                className="cursor-pointer rounded-lg bg-teal-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      </MotionModalLayer>

      <AlertModal
        open={pendingDeleteRoomId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteRoomId(null);
        }}
        title="방 삭제"
        description={
          pendingDeleteRoom
            ? `삭제하시겠습니까? 「${pendingDeleteRoom.name}」과(와) 그 방의 가구·보관 칸·물품도 함께 제거됩니다.`
            : "삭제하시겠습니까?"
        }
        confirmLabel="삭제"
        cancelLabel="취소"
        variant="danger"
        onConfirm={() => {
          if (pendingDeleteRoomId) confirmDeleteRoom(pendingDeleteRoomId);
          setPendingDeleteRoomId(null);
        }}
      />
    </div>
  );
}
