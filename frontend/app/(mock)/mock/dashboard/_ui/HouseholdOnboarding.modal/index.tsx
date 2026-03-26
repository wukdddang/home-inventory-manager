"use client";

import { cn } from "@/lib/utils";
import type { Household } from "@/types/domain";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight, Home, Layers3, MapPin, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useDashboard } from "../../_hooks/useDashboard";
import { newEntityId } from "../../_lib/dashboard-helpers";

type Step = "rooms" | "furniture" | "storage" | "done";
const STEPS: Step[] = ["rooms", "furniture", "storage", "done"];

const STEP_META: Record<Step, { label: string; icon: typeof Home }> = {
  rooms: { label: "방 추가", icon: Home },
  furniture: { label: "가구", icon: Layers3 },
  storage: { label: "보관 장소", icon: MapPin },
  done: { label: "완료", icon: Check },
};

export type HouseholdOnboardingPanelProps = {
  open: boolean;
  householdId: string | null;
  onClose: () => void;
};

function StepIndicator({ current }: { current: Step }) {
  return (
    <nav className="flex items-center gap-1" aria-label="설정 단계">
      {STEPS.map((s, i) => {
        const active = s === current;
        const done = STEPS.indexOf(current) > i;
        const Icon = STEP_META[s].icon;
        return (
          <div key={s} className="flex items-center gap-1">
            {i > 0 && (
              <ChevronRight
                className={cn("size-3.5 shrink-0", done ? "text-teal-500" : "text-zinc-600")}
                aria-hidden
              />
            )}
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition-colors",
                active
                  ? "bg-teal-500/20 text-teal-200 ring-1 ring-teal-500/30"
                  : done
                    ? "text-teal-400"
                    : "text-zinc-500",
              )}
            >
              <Icon className="size-3.5 shrink-0" aria-hidden />
              {STEP_META[s].label}
            </span>
          </div>
        );
      })}
    </nav>
  );
}

function RoomsStep({
  household,
  onAddRoom,
}: {
  household: Household;
  onAddRoom: (name: string) => void;
}) {
  const [name, setName] = useState("");

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAddRoom(trimmed);
    setName("");
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-300">
        거점에 방을 추가하세요. 거실, 주방, 안방 등 재고를 보관하는 공간을 나눕니다.
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="방 이름 (예: 거실)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-teal-500"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!name.trim()}
          className="shrink-0 rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-teal-400 disabled:opacity-40"
        >
          추가
        </button>
      </div>
      {household.rooms.length > 0 && (
        <ul className="space-y-1">
          {household.rooms.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200"
            >
              <Home className="size-3.5 shrink-0 text-teal-400" aria-hidden />
              {r.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FurnitureStep({
  household,
  onAddFurniture,
}: {
  household: Household;
  onAddFurniture: (roomId: string, label: string) => void;
}) {
  const [selectedRoom, setSelectedRoom] = useState(household.rooms[0]?.id ?? "");
  const [label, setLabel] = useState("");

  const handleAdd = () => {
    const trimmed = label.trim();
    if (!trimmed || !selectedRoom) return;
    onAddFurniture(selectedRoom, trimmed);
    setLabel("");
  };

  const placements = household.furniturePlacements ?? [];

  if (household.rooms.length === 0) {
    return (
      <p className="text-sm text-zinc-400">
        방을 먼저 추가하세요. 이전 단계로 돌아가서 방을 추가할 수 있습니다.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-300">
        방에 가구를 배치하세요. 냉장고, 책장, 서랍장 등 재고를 담는 가구입니다.
        나중에 추가해도 됩니다.
      </p>
      <div className="flex flex-wrap gap-2">
        <select
          value={selectedRoom}
          onChange={(e) => setSelectedRoom(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-teal-500"
        >
          {household.rooms.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="가구 이름 (예: 냉장고)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-teal-500"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!label.trim() || !selectedRoom}
          className="shrink-0 rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-teal-400 disabled:opacity-40"
        >
          추가
        </button>
      </div>
      {placements.length > 0 && (
        <ul className="space-y-1">
          {placements.map((fp) => {
            const room = household.rooms.find((r) => r.id === fp.roomId);
            return (
              <li
                key={fp.id}
                className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200"
              >
                <Layers3 className="size-3.5 shrink-0 text-teal-400" aria-hidden />
                {fp.label}
                <span className="text-xs text-zinc-500">({room?.name ?? "?"})</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function StorageStep({
  household,
  onAddStorage,
}: {
  household: Household;
  onAddStorage: (roomId: string, furnitureId: string | null, name: string) => void;
}) {
  const [selectedRoom, setSelectedRoom] = useState(household.rooms[0]?.id ?? "");
  const [selectedFurniture, setSelectedFurniture] = useState("");
  const [name, setName] = useState("");

  const roomFurniture = (household.furniturePlacements ?? []).filter(
    (fp) => fp.roomId === selectedRoom,
  );
  const locations = household.storageLocations ?? [];

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed || !selectedRoom) return;
    onAddStorage(selectedRoom, selectedFurniture || null, trimmed);
    setName("");
  };

  if (household.rooms.length === 0) {
    return (
      <p className="text-sm text-zinc-400">
        방을 먼저 추가하세요.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-300">
        재고를 넣을 보관 장소를 추가하세요. 방 직속이거나 가구 아래에 둘 수 있습니다.
        나중에 추가해도 됩니다.
      </p>
      <div className="flex flex-wrap gap-2">
        <select
          value={selectedRoom}
          onChange={(e) => {
            setSelectedRoom(e.target.value);
            setSelectedFurniture("");
          }}
          className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-teal-500"
        >
          {household.rooms.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <select
          value={selectedFurniture}
          onChange={(e) => setSelectedFurniture(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-teal-500"
        >
          <option value="">방 직속</option>
          {roomFurniture.map((fp) => (
            <option key={fp.id} value={fp.id}>{fp.label} 아래</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="보관 장소 이름 (예: 냉장실 상단)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-teal-500"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!name.trim() || !selectedRoom}
          className="shrink-0 rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-teal-400 disabled:opacity-40"
        >
          추가
        </button>
      </div>
      {locations.length > 0 && (
        <ul className="space-y-1">
          {locations.map((loc) => {
            const room = household.rooms.find((r) => r.id === loc.roomId);
            const furn = (household.furniturePlacements ?? []).find(
              (f) => f.id === loc.furniturePlacementId,
            );
            return (
              <li
                key={loc.id}
                className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200"
              >
                <MapPin className="size-3.5 shrink-0 text-teal-400" aria-hidden />
                {loc.name}
                <span className="text-xs text-zinc-500">
                  ({furn ? `${room?.name} > ${furn.label}` : room?.name ?? "?"})
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function DoneStep({ household }: { household: Household }) {
  const rooms = household.rooms.length;
  const furniture = (household.furniturePlacements ?? []).length;
  const storage = (household.storageLocations ?? []).length;

  return (
    <div className="space-y-3 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-500/20 ring-1 ring-teal-500/30">
        <Check className="size-7 text-teal-400" />
      </div>
      <p className="text-sm text-zinc-200">
        <strong className="text-white">{household.name}</strong> 거점 구조 설정이 완료되었습니다.
      </p>
      <div className="flex justify-center gap-4 text-xs text-zinc-400">
        <span>방 {rooms}개</span>
        <span>가구 {furniture}개</span>
        <span>보관 장소 {storage}개</span>
      </div>
      <p className="text-xs text-zinc-500">
        왼쪽 방·가구 패널에서 언제든 수정할 수 있습니다.
      </p>
    </div>
  );
}

/**
 * 좌측 컬럼에 인라인으로 끼워 넣는 온보딩 패널.
 * 구조도(우측)를 가리지 않고, 추가한 방·가구·보관 장소가 실시간 반영되는 것을 함께 볼 수 있다.
 */
export function HouseholdOnboardingPanel({
  open,
  householdId,
  onClose,
}: HouseholdOnboardingPanelProps) {
  const { households, 거점을_갱신_한다 } = useDashboard();
  const [step, setStep] = useState<Step>("rooms");

  const household = households.find((h) => h.id === householdId) ?? null;
  const stepIdx = STEPS.indexOf(step);
  const isLast = step === "done";

  const handleNext = () => {
    if (isLast) {
      handleClose();
      return;
    }
    setStep(STEPS[stepIdx + 1]);
  };

  const handleBack = () => {
    if (stepIdx > 0) setStep(STEPS[stepIdx - 1]);
  };

  const handleClose = () => {
    setStep("rooms");
    onClose();
  };

  const handleAddRoom = useCallback(
    (name: string) => {
      if (!householdId) return;
      거점을_갱신_한다(householdId, (h) => ({
        ...h,
        rooms: [
          ...h.rooms,
          {
            id: newEntityId(),
            name,
            x: (h.rooms.length % 3) * 160,
            y: Math.floor(h.rooms.length / 3) * 100,
            width: 120,
            height: 80,
          },
        ],
      }));
    },
    [householdId, 거점을_갱신_한다],
  );

  const handleAddFurniture = useCallback(
    (roomId: string, label: string) => {
      if (!householdId) return;
      거점을_갱신_한다(householdId, (h) => ({
        ...h,
        furniturePlacements: [
          ...(h.furniturePlacements ?? []),
          { id: newEntityId(), roomId, label, sortOrder: (h.furniturePlacements ?? []).length },
        ],
      }));
    },
    [householdId, 거점을_갱신_한다],
  );

  const handleAddStorage = useCallback(
    (roomId: string, furnitureId: string | null, name: string) => {
      if (!householdId) return;
      거점을_갱신_한다(householdId, (h) => ({
        ...h,
        storageLocations: [
          ...(h.storageLocations ?? []),
          {
            id: newEntityId(),
            name,
            roomId: furnitureId ? null : roomId,
            furniturePlacementId: furnitureId,
            sortOrder: (h.storageLocations ?? []).length,
          },
        ],
      }));
    },
    [householdId, 거점을_갱신_한다],
  );

  if (!open || !household) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden"
    >
      <div className="rounded-2xl border border-teal-500/30 bg-zinc-950 ring-1 ring-teal-500/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-white">
              {household.name} — 구조 설정
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              오른쪽 구조도에서 추가 결과를 실시간으로 확인할 수 있습니다
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
            aria-label="닫기"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="border-b border-zinc-800/60 px-4 py-2.5">
          <StepIndicator current={step} />
        </div>

        {/* Content */}
        <div className="min-h-40 px-4 py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.15 }}
            >
              {step === "rooms" && (
                <RoomsStep household={household} onAddRoom={handleAddRoom} />
              )}
              {step === "furniture" && (
                <FurnitureStep household={household} onAddFurniture={handleAddFurniture} />
              )}
              {step === "storage" && (
                <StorageStep household={household} onAddStorage={handleAddStorage} />
              )}
              {step === "done" && <DoneStep household={household} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-3">
          <div>
            {stepIdx > 0 && !isLast ? (
              <button
                type="button"
                onClick={handleBack}
                className="rounded-lg px-3 py-1.5 text-xs text-zinc-400 transition hover:text-zinc-200"
              >
                이전
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg px-3 py-1.5 text-xs text-zinc-500 transition hover:text-zinc-300"
              >
                건너뛰기
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleNext}
            className="rounded-lg bg-teal-500 px-4 py-1.5 text-sm font-medium text-zinc-950 transition hover:bg-teal-400"
          >
            {isLast ? "완료" : "다음"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
