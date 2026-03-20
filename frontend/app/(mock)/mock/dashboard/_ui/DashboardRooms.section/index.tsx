"use client";

import { AlertModal } from "@/app/_ui/alert-modal";
import { useState } from "react";
import { useDashboard } from "../../_hooks/useDashboard";
import { defaultRoomGrid, newEntityId } from "../../_lib/dashboard-helpers";
import type { Household, StructureRoom } from "@/types/domain";

type DashboardRoomsSectionProps = {
  selected: Household | null;
  selectedRoomId: string | null;
  onRoomSelect: (roomId: string | null) => void;
};

export function DashboardRoomsSection({
  selected,
  selectedRoomId,
  onRoomSelect,
}: DashboardRoomsSectionProps) {
  const { 거점을_갱신_한다 } = useDashboard();
  const [roomDraftName, setRoomDraftName] = useState("");
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editingRoomName, setEditingRoomName] = useState("");
  const [pendingDeleteRoomId, setPendingDeleteRoomId] = useState<string | null>(
    null,
  );

  if (!selected) return null;

  const handleAddRoom = () => {
    const label =
      roomDraftName.trim() || `방 ${selected.rooms.length + 1}`;
    const grid = defaultRoomGrid(selected.rooms.length);
    const room: StructureRoom = {
      id: newEntityId(),
      name: label,
      ...grid,
    };
    거점을_갱신_한다(selected.id, (h) => ({
      ...h,
      rooms: [...h.rooms, room],
    }));
    setRoomDraftName("");
    onRoomSelect(room.id);
  };

  const handleSaveRoomName = (roomId: string) => {
    const name = editingRoomName.trim();
    if (!name) return;
    거점을_갱신_한다(selected.id, (h) => ({
      ...h,
      rooms: h.rooms.map((r) => (r.id === roomId ? { ...r, name } : r)),
    }));
    setEditingRoomId(null);
  };

  const confirmDeleteRoom = (roomId: string) => {
    거점을_갱신_한다(selected.id, (h) => ({
      ...h,
      rooms: h.rooms.filter((r) => r.id !== roomId),
      items: h.items.filter((i) => i.roomId !== roomId),
    }));
    if (selectedRoomId === roomId) onRoomSelect(null);
    setEditingRoomId(null);
  };

  const pendingDeleteRoom = pendingDeleteRoomId
    ? selected.rooms.find((r) => r.id === pendingDeleteRoomId)
    : null;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      <h2 className="text-base font-semibold text-white">방 관리 (CRUD)</h2>
      <p className="mt-1 text-sm text-zinc-500">
        방을 추가하고 이름을 지정하세요. 구조도에서 클릭해 선택할 수 있습니다.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <label className="text-xs text-zinc-400">새 방 이름</label>
          <input
            value={roomDraftName}
            onChange={(e) => setRoomDraftName(e.target.value)}
            placeholder="거실, 주방…"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500"
          />
        </div>
        <button
          type="button"
          onClick={handleAddRoom}
          className="cursor-pointer rounded-xl border border-zinc-600 px-4 py-2 text-sm font-medium text-teal-300 hover:bg-zinc-800"
        >
          방 추가
        </button>
      </div>
      <ul className="mt-4 divide-y divide-zinc-800 rounded-xl border border-zinc-800">
        {selected.rooms.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm text-zinc-500">
            방이 없습니다. 위에서 방을 추가하세요.
          </li>
        ) : (
          selected.rooms.map((r) => (
            <li
              key={r.id}
              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              {editingRoomId === r.id ? (
                <div className="flex flex-1 flex-wrap items-center gap-2">
                  <input
                    value={editingRoomName}
                    onChange={(e) => setEditingRoomName(e.target.value)}
                    className="min-w-[160px] flex-1 rounded-lg border border-zinc-600 bg-zinc-950 px-2 py-1.5 text-sm text-white"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveRoomName(r.id)}
                    className="cursor-pointer rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white"
                  >
                    저장
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingRoomId(null)}
                    className="cursor-pointer text-xs text-zinc-500"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <span className="font-medium text-zinc-200">{r.name}</span>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingRoomId(r.id);
                    setEditingRoomName(r.name);
                  }}
                  className="cursor-pointer rounded-lg border border-zinc-600 px-3 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
                >
                  이름 수정
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDeleteRoomId(r.id)}
                  className="cursor-pointer rounded-lg border border-rose-900/50 px-3 py-1 text-xs text-rose-400 hover:bg-rose-950/40"
                >
                  삭제
                </button>
              </div>
            </li>
          ))
        )}
      </ul>

      <AlertModal
        open={pendingDeleteRoomId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteRoomId(null);
        }}
        title="방 삭제"
        description={
          pendingDeleteRoom
            ? `삭제하시겠습니까? 「${pendingDeleteRoom.name}」에 묶인 물품도 함께 제거됩니다.`
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
