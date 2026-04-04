"use client";

import { AlertModal } from "@/app/_ui/alert-modal";
import { FormModal } from "@/app/_ui/form-modal";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { useDashboard } from "../../_hooks/useDashboard";
import {
  getMockAppliancesSession,
  updateMockAppliancesSession,
} from "../../../appliances/_context/appliances-mock.service";
import type { Appliance, Household } from "@/types/domain";

const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-500";

/** 주요 추가 동작 — 틸(가구·보관 장소) */
const btnAdd =
  "inline-flex cursor-pointer shrink-0 items-center justify-center gap-1 rounded-md border border-teal-600/60 bg-teal-950/40 px-2 py-0.5 text-xs font-medium leading-tight text-teal-100 hover:bg-teal-900/35";

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

function PencilMiniIcon({ className }: { className?: string }) {
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
        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
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

function ApplianceIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={cn("size-4 shrink-0 text-sky-400/90", className)}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Z"
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
  const {
    가구를_추가_한다,
    가구를_삭제_한다,
    보관장소를_추가_한다,
    보관장소_이름을_수정_한다,
    보관장소를_삭제_한다,
  } = useDashboard();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(
    null,
  );

  // ── 위치 추가 (가구/가전 통합) 모달 ──
  const [placementModalOpen, setPlacementModalOpen] = useState(false);
  const [placementModalRoomId, setPlacementModalRoomId] = useState<
    string | null
  >(null);
  const [placementType, setPlacementType] = useState<"furniture" | "appliance">(
    "furniture",
  );
  const [placementNameDraft, setPlacementNameDraft] = useState("");
  const [placementBrandDraft, setPlacementBrandDraft] = useState("");
  const [placementModelDraft, setPlacementModelDraft] = useState("");

  // ── 보관 장소 추가 모달 (가구 하위) ──
  const [subSlotModalOpen, setSubSlotModalOpen] = useState(false);
  const [subSlotModalParentId, setSubSlotModalParentId] = useState<
    string | null
  >(null);
  const [subSlotModalParentKind, setSubSlotModalParentKind] = useState<
    "furniture" | "appliance"
  >("furniture");
  const [subSlotModalDraft, setSubSlotModalDraft] = useState("");

  // ── 보관 장소 이름 수정 모달 ──
  const [renameSlotModalOpen, setRenameSlotModalOpen] = useState(false);
  const [renameSlotId, setRenameSlotId] = useState<string | null>(null);
  const [renameSlotDraft, setRenameSlotDraft] = useState("");

  // ── 탭 선택 상태 (가구 또는 가전 중 하나) ──
  const [selectedTabId, setSelectedTabId] = useState<string | null>(null);

  if (!selected) return null;

  const placements = selected.furniturePlacements ?? [];
  const slots = selected.storageLocations ?? [];

  const visibleRooms =
    selectedRoomId != null
      ? selected.rooms.filter((r) => r.id === selectedRoomId)
      : [];

  // ── 방별 가구 목록 ──
  const furnitureInRoom = (roomId: string) =>
    [...placements]
      .filter((f) => f.roomId === roomId)
      .sort(
        (a, b) =>
          (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
          a.label.localeCompare(b.label, "ko"),
      );

  // ── 방별 가전 목록 ──
  const allAppliances = getMockAppliancesSession();
  const appliancesInRoom = (roomId: string) =>
    allAppliances.filter((a) => a.roomId === roomId && a.status === "active");

  // ── 가구 하위 보관 장소 ──
  const slotsUnderFurniture = (furnitureId: string) =>
    slots.filter((s) => s.furniturePlacementId === furnitureId);

  // ── 가전 하위 보관 장소 ──
  const slotsUnderAppliance = (applianceId: string) =>
    slots.filter((s) => s.applianceId === applianceId);

  // ── 위치 추가 (가구/가전 통합) ──
  const openPlacementModal = (roomId: string) => {
    setPlacementModalRoomId(roomId);
    setPlacementType("furniture");
    setPlacementNameDraft("");
    setPlacementBrandDraft("");
    setPlacementModelDraft("");
    setPlacementModalOpen(true);
  };

  const submitPlacementModal = async () => {
    if (!placementModalRoomId || !selected) return;
    const name = placementNameDraft.trim();
    if (!name) {
      toast({
        title:
          placementType === "furniture"
            ? "가구 이름을 입력하세요"
            : "가전 이름을 입력하세요",
        description: "이름을 입력해 주세요.",
        variant: "warning",
      });
      return;
    }

    setIsSubmitting(true);

    if (placementType === "furniture") {
      const inRoom = furnitureInRoom(placementModalRoomId);
      const nextSort =
        Math.max(0, ...inRoom.map((f) => f.sortOrder ?? 0)) + 1;
      const fp = await 가구를_추가_한다(
        selected.id,
        placementModalRoomId,
        name,
        null,
        nextSort,
      );
      setIsSubmitting(false);
      if (!fp) return;
      setSelectedTabId(fp.id);
      setPlacementModalOpen(false);
      setPlacementNameDraft("");
      setPlacementModalRoomId(null);
      toast({ title: "가구가 추가되었습니다", description: name });
    } else {
      const newAppliance: Appliance = {
        id: `appl-${crypto.randomUUID()}`,
        householdId: selected.id,
        name,
        brand: placementBrandDraft.trim() || undefined,
        modelName: placementModelDraft.trim() || undefined,
        roomId: placementModalRoomId,
        status: "active",
        createdAt: new Date().toISOString().slice(0, 10),
      };
      updateMockAppliancesSession((prev) => [...prev, newAppliance]);
      setIsSubmitting(false);
      setSelectedTabId(newAppliance.id);
      setPlacementModalOpen(false);
      setPlacementNameDraft("");
      setPlacementBrandDraft("");
      setPlacementModelDraft("");
      setPlacementModalRoomId(null);
      toast({ title: "가전이 등록되었습니다", description: name });
    }
  };

  // ── 보관 장소 추가 (가구 또는 가전 하위) ──
  const openSubSlotModal = (
    parentId: string,
    kind: "furniture" | "appliance",
  ) => {
    setSubSlotModalParentId(parentId);
    setSubSlotModalParentKind(kind);
    setSubSlotModalDraft("");
    setSubSlotModalOpen(true);
  };

  const submitSubSlotModal = async () => {
    if (!subSlotModalParentId || !selected) return;
    const name = subSlotModalDraft.trim();
    if (!name) {
      toast({
        title: "보관 장소 이름을 입력하세요",
        description: "이름을 입력해 주세요.",
        variant: "warning",
      });
      return;
    }

    const existingSlots =
      subSlotModalParentKind === "furniture"
        ? slotsUnderFurniture(subSlotModalParentId)
        : slotsUnderAppliance(subSlotModalParentId);
    const nextSort =
      Math.max(0, ...existingSlots.map((s) => s.sortOrder ?? 0)) + 1;

    setIsSubmitting(true);
    const created = await 보관장소를_추가_한다(selected.id, {
      name,
      roomId: null,
      furniturePlacementId:
        subSlotModalParentKind === "furniture" ? subSlotModalParentId : null,
      applianceId:
        subSlotModalParentKind === "appliance" ? subSlotModalParentId : null,
      sortOrder: nextSort,
    });
    setIsSubmitting(false);
    if (!created) return;
    toast({ title: "보관 장소가 추가되었습니다", description: name });
    setSubSlotModalOpen(false);
    setSubSlotModalDraft("");
    setSubSlotModalParentId(null);
  };

  // ── 삭제 ──
  const requestDeleteStorage = (storageId: string) => {
    setPendingDelete({ kind: "storage", id: storageId });
  };

  const confirmDeleteStorage = (storageId: string) => {
    void 보관장소를_삭제_한다(selected.id, storageId);
    toast({ title: "보관 장소가 삭제되었습니다", variant: "success" });
  };

  const confirmDeleteFurniture = (furnitureId: string) => {
    const label =
      placements.find((f) => f.id === furnitureId)?.label ?? "";
    void 가구를_삭제_한다(selected.id, furnitureId);
    toast({
      title: "가구가 삭제되었습니다",
      description: label
        ? `「${label}」의 보관 장소·재고도 함께 정리되었습니다.`
        : "연결된 보관 장소·재고도 함께 정리되었습니다.",
      variant: "success",
    });
  };

  // ── 보관 장소 이름 수정 ──
  const submitRenameSlotModal = async () => {
    if (!renameSlotId || !selected) return;
    const name = renameSlotDraft.trim();
    if (!name) {
      toast({ title: "이름을 입력하세요", variant: "warning" });
      return;
    }
    setIsSubmitting(true);
    await 보관장소_이름을_수정_한다(selected.id, renameSlotId, name);
    setIsSubmitting(false);
    toast({
      title: "보관 장소 이름을 수정했습니다",
      description: name,
      variant: "success",
    });
    setRenameSlotModalOpen(false);
    setRenameSlotId(null);
    setRenameSlotDraft("");
  };

  // ── 삭제 확인 설명 ──
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
      ? `「${f.label}」 가구를 삭제합니다. 그 아래 보관 장소와 재고도 함께 제거됩니다.`
      : "삭제하시겠습니까?";
  };

  const placementModalRoomName =
    placementModalRoomId != null
      ? (selected.rooms.find((r) => r.id === placementModalRoomId)?.name ?? "")
      : "";

  const subSlotModalParentLabel = (() => {
    if (!subSlotModalParentId) return "";
    if (subSlotModalParentKind === "furniture") {
      return placements.find((f) => f.id === subSlotModalParentId)?.label ?? "";
    }
    return (
      allAppliances.find((a) => a.id === subSlotModalParentId)?.name ?? ""
    );
  })();

  // ── 보증 상태 뱃지 ──
  const warrantyBadge = (expiresOn?: string) => {
    if (!expiresOn) {
      return (
        <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
          보증 정보 없음
        </span>
      );
    }
    const today = new Date().toISOString().slice(0, 10);
    const isExpired = expiresOn < today;
    return (
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
          isExpired
            ? "bg-rose-950/50 text-rose-300"
            : "bg-emerald-950/50 text-emerald-300",
        )}
      >
        {isExpired ? "보증 만료" : `보증 ~${expiresOn}`}
      </span>
    );
  };

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
          가구 · 가전 · 보관 장소
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-zinc-300">
          방을 선택하면 가구와 가전을 등록하고, 각각의 하위 보관 장소를 관리할 수
          있습니다.
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
            const fps = furnitureInRoom(room.id);
            const appls = appliancesInRoom(room.id);

            return (
              <li key={room.id} className="rounded-xl">
                <h3 className="text-xs font-semibold text-teal-200/95">
                  {room.name}
                </h3>

                {fps.length === 0 && appls.length === 0 ? (
                  <p className="mt-3 rounded-lg border border-dashed border-zinc-700/80 bg-zinc-900/30 px-3 py-4 text-center text-xs text-zinc-300">
                    이 방에 등록된 가구나 가전이 없습니다. 아래 버튼으로 추가하세요.
                  </p>
                ) : (
                  <>
                    {/* ── 탭바: 가구/가전 목록 ── */}
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="mb-1.5 text-xs font-medium text-zinc-400">
                          가구·가전 목록
                        </p>
                        <div
                          className="flex flex-wrap gap-1.5"
                          role="tablist"
                          aria-label="가구·가전"
                        >
                          {fps.map((fp) => {
                            const sel = selectedTabId === fp.id;
                            return (
                              <button
                                key={fp.id}
                                type="button"
                                role="tab"
                                aria-selected={sel}
                                data-testid={`furniture-tab-${fp.id}`}
                                onClick={() => setSelectedTabId(sel ? null : fp.id)}
                                className={cn(
                                  "inline-flex max-w-full cursor-pointer items-center gap-1.5 truncate rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                                  sel
                                    ? "border-teal-500/50 bg-teal-950/40 text-teal-100"
                                    : "border-zinc-700 bg-zinc-950/80 text-zinc-300 hover:border-zinc-600 hover:text-zinc-200",
                                )}
                              >
                                <PlacementsFurnitureIcon className="size-3" />
                                {fp.label}
                              </button>
                            );
                          })}
                          {appls.map((appl) => {
                            const sel = selectedTabId === appl.id;
                            return (
                              <button
                                key={appl.id}
                                type="button"
                                role="tab"
                                aria-selected={sel}
                                data-testid={`appliance-tab-${appl.id}`}
                                onClick={() => setSelectedTabId(sel ? null : appl.id)}
                                className={cn(
                                  "inline-flex max-w-full cursor-pointer items-center gap-1.5 truncate rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                                  sel
                                    ? "border-sky-500/50 bg-sky-950/40 text-sky-100"
                                    : "border-zinc-700 bg-zinc-950/80 text-zinc-300 hover:border-zinc-600 hover:text-zinc-200",
                                )}
                              >
                                <ApplianceIcon className="size-3" />
                                {appl.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* ── 선택된 탭 상세 패널 ── */}
                    {(() => {
                      const selFp = fps.find((f) => f.id === selectedTabId);
                      const selAppl = appls.find((a) => a.id === selectedTabId);

                      if (selFp) {
                        const subSlots = slotsUnderFurniture(selFp.id);
                        return (
                          <div
                            className="mt-3 rounded-lg border border-teal-500/30 bg-zinc-900/40 p-3"
                            role="tabpanel"
                            data-testid={`furniture-panel-${selFp.id}`}
                          >
                            <div className="flex items-start justify-between gap-2 border-b border-teal-500/20 pb-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <PlacementsFurnitureIcon className="size-3.5" />
                                  <p className="text-sm font-semibold text-zinc-100">
                                    {selFp.label}
                                  </p>
                                </div>
                                <p className="mt-0.5 text-[10px] text-zinc-500">
                                  {subSlots.length}개 보관 장소
                                </p>
                              </div>
                              <button
                                type="button"
                                className={`${btnDangerIcon} shrink-0`}
                                title="이 가구와 그 아래 보관 장소·재고를 삭제합니다"
                                aria-label={`「${selFp.label}」 가구 삭제`}
                                onClick={() =>
                                  setPendingDelete({ kind: "furniture", id: selFp.id })
                                }
                              >
                                <TrashIcon />
                              </button>
                            </div>
                            <div className="mt-2">
                              <ul className="space-y-1">
                                {subSlots.length === 0 ? (
                                  <li className="text-xs text-zinc-300">
                                    보관 장소가 없습니다.
                                  </li>
                                ) : (
                                  subSlots.map((s) => (
                                    <li
                                      key={s.id}
                                      className="flex items-center justify-between gap-2 rounded-md bg-zinc-900/80 px-2 py-1 text-xs text-zinc-300"
                                    >
                                      <span>{s.name}</span>
                                      <div className="flex shrink-0 items-center gap-1">
                                        <button
                                          type="button"
                                          className="inline-flex cursor-pointer items-center justify-center rounded-md border border-zinc-700/50 p-1.5 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                                          title="이름 수정"
                                          onClick={() => {
                                            setRenameSlotId(s.id);
                                            setRenameSlotDraft(s.name);
                                            setRenameSlotModalOpen(true);
                                          }}
                                        >
                                          <PencilMiniIcon />
                                        </button>
                                        <button
                                          type="button"
                                          className={`${btnDangerIcon} shrink-0`}
                                          title="삭제"
                                          onClick={() => requestDeleteStorage(s.id)}
                                        >
                                          <TrashIcon />
                                        </button>
                                      </div>
                                    </li>
                                  ))
                                )}
                              </ul>
                              <div className="mt-1.5">
                                <button
                                  type="button"
                                  className={`${btnAdd} w-full sm:w-auto`}
                                  onClick={() => openSubSlotModal(selFp.id, "furniture")}
                                >
                                  <PlusMiniIcon />
                                  보관 장소 추가
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      if (selAppl) {
                        const subSlots = slotsUnderAppliance(selAppl.id);
                        return (
                          <div
                            className="mt-3 rounded-lg border border-sky-500/30 bg-zinc-900/40 p-3"
                            role="tabpanel"
                            data-testid={`appliance-panel-${selAppl.id}`}
                          >
                            <div className="flex items-start justify-between gap-2 border-b border-sky-500/20 pb-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <ApplianceIcon className="size-3.5" />
                                  <p className="text-sm font-semibold text-zinc-100">
                                    {selAppl.name}
                                  </p>
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                  {selAppl.brand && (
                                    <span className="text-[10px] text-zinc-500">
                                      {selAppl.brand}
                                      {selAppl.modelName ? ` · ${selAppl.modelName}` : ""}
                                    </span>
                                  )}
                                  {warrantyBadge(selAppl.warrantyExpiresOn)}
                                  <span className="text-[10px] text-zinc-500">
                                    {subSlots.length}개 보관 장소
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="mt-2">
                              <ul className="space-y-1">
                                {subSlots.length === 0 ? (
                                  <li className="text-xs text-zinc-300">
                                    보관 장소가 없습니다.
                                  </li>
                                ) : (
                                  subSlots.map((s) => (
                                    <li
                                      key={s.id}
                                      className="flex items-center justify-between gap-2 rounded-md bg-zinc-900/80 px-2 py-1 text-xs text-zinc-300"
                                    >
                                      <span>{s.name}</span>
                                      <div className="flex shrink-0 items-center gap-1">
                                        <button
                                          type="button"
                                          className="inline-flex cursor-pointer items-center justify-center rounded-md border border-zinc-700/50 p-1.5 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                                          title="이름 수정"
                                          onClick={() => {
                                            setRenameSlotId(s.id);
                                            setRenameSlotDraft(s.name);
                                            setRenameSlotModalOpen(true);
                                          }}
                                        >
                                          <PencilMiniIcon />
                                        </button>
                                        <button
                                          type="button"
                                          className={`${btnDangerIcon} shrink-0`}
                                          title="삭제"
                                          onClick={() => requestDeleteStorage(s.id)}
                                        >
                                          <TrashIcon />
                                        </button>
                                      </div>
                                    </li>
                                  ))
                                )}
                              </ul>
                              <div className="mt-1.5">
                                <button
                                  type="button"
                                  className={`${btnAdd} w-full sm:w-auto`}
                                  onClick={() => openSubSlotModal(selAppl.id, "appliance")}
                                >
                                  <PlusMiniIcon />
                                  보관 장소 추가
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return null;
                    })()}
                  </>
                )}

                {/* ── 위치 추가 (가구/가전 통합) 버튼 ── */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={`${btnAdd}`}
                    data-testid="add-placement-btn"
                    onClick={() => openPlacementModal(room.id)}
                  >
                    <PlusMiniIcon />
                    위치 추가
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* ── 위치 추가 (가구/가전 통합) 모달 ── */}
      <FormModal
        open={placementModalOpen}
        onOpenChange={(open) => {
          setPlacementModalOpen(open);
          if (!open) {
            setPlacementNameDraft("");
            setPlacementBrandDraft("");
            setPlacementModelDraft("");
            setPlacementModalRoomId(null);
          }
        }}
        title="위치 추가"
        description={
          placementModalRoomName
            ? `「${placementModalRoomName}」에 추가할 항목 유형과 이름을 입력합니다.`
            : "항목 유형과 이름을 입력합니다."
        }
        submitLabel="추가"
        cancelLabel="취소"
        submitDisabled={!placementNameDraft.trim() || isSubmitting}
        onSubmit={() => {
          void submitPlacementModal();
        }}
      >
        <div data-testid="add-placement-modal" />
        {/* ── 유형 선택 ── */}
        <fieldset className="mb-3">
          <legend className="mb-1.5 block text-xs font-medium text-zinc-300">
            유형
          </legend>
          <div className="flex gap-3">
            <label
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                placementType === "furniture"
                  ? "border-teal-500 bg-teal-950/50 text-teal-100"
                  : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600",
              )}
            >
              <input
                type="radio"
                name="placement-type"
                value="furniture"
                checked={placementType === "furniture"}
                onChange={() => setPlacementType("furniture")}
                className="sr-only"
                data-testid="placement-type-furniture"
              />
              <PlacementsFurnitureIcon className="size-3.5" />
              가구
            </label>
            <label
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                placementType === "appliance"
                  ? "border-cyan-500 bg-cyan-950/50 text-cyan-100"
                  : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600",
              )}
            >
              <input
                type="radio"
                name="placement-type"
                value="appliance"
                checked={placementType === "appliance"}
                onChange={() => setPlacementType("appliance")}
                className="sr-only"
                data-testid="placement-type-appliance"
              />
              <ApplianceIcon className="size-3.5" />
              가전
            </label>
          </div>
        </fieldset>

        {/* ── 이름 ── */}
        <label className="block text-xs font-medium text-zinc-300">
          {placementType === "furniture" ? "가구 이름" : "가전 이름"}
        </label>
        <input
          value={placementNameDraft}
          onChange={(e) => setPlacementNameDraft(e.target.value)}
          placeholder={
            placementType === "furniture"
              ? "예: 주방 선반, 옷장"
              : "예: 드럼세탁기, 냉장고"
          }
          className={`${inputClass} mt-1`}
          autoFocus
        />

        {/* ── 가전 전용 필드 ── */}
        {placementType === "appliance" && (
          <>
            <label className="mt-3 block text-xs font-medium text-zinc-300">
              브랜드 <span className="text-zinc-500">(선택)</span>
            </label>
            <input
              value={placementBrandDraft}
              onChange={(e) => setPlacementBrandDraft(e.target.value)}
              placeholder="예: LG, Samsung"
              className={`${inputClass} mt-1`}
            />
            <label className="mt-3 block text-xs font-medium text-zinc-300">
              모델명 <span className="text-zinc-500">(선택)</span>
            </label>
            <input
              value={placementModelDraft}
              onChange={(e) => setPlacementModelDraft(e.target.value)}
              placeholder="예: FX24KN"
              className={`${inputClass} mt-1`}
            />
          </>
        )}
      </FormModal>

      {/* ── 보관 장소 추가 모달 ── */}
      <FormModal
        open={subSlotModalOpen}
        onOpenChange={(open) => {
          setSubSlotModalOpen(open);
          if (!open) {
            setSubSlotModalDraft("");
            setSubSlotModalParentId(null);
          }
        }}
        title="보관 장소 추가"
        description={
          subSlotModalParentLabel
            ? `「${subSlotModalParentLabel}」 아래에 보관 장소 이름을 정합니다.`
            : "보관 장소 이름을 입력합니다."
        }
        submitLabel="추가"
        cancelLabel="취소"
        submitDisabled={!subSlotModalDraft.trim() || isSubmitting}
        onSubmit={() => {
          void submitSubSlotModal();
        }}
      >
        <label className="block text-xs font-medium text-zinc-300">
          보관 장소 이름
        </label>
        <input
          value={subSlotModalDraft}
          onChange={(e) => setSubSlotModalDraft(e.target.value)}
          placeholder="예: 서랍 왼쪽, 냉동실 1칸"
          className={`${inputClass} mt-1`}
          autoFocus
        />
      </FormModal>

      {/* ── 보관 장소 이름 수정 모달 ── */}
      <FormModal
        open={renameSlotModalOpen}
        onOpenChange={(open) => {
          setRenameSlotModalOpen(open);
          if (!open) {
            setRenameSlotId(null);
            setRenameSlotDraft("");
          }
        }}
        title="보관 장소 이름 수정"
        description={
          renameSlotId
            ? `「${slots.find((s) => s.id === renameSlotId)?.name ?? ""}」의 이름을 변경합니다.`
            : "이름을 입력하세요."
        }
        submitLabel="수정"
        cancelLabel="취소"
        submitDisabled={!renameSlotDraft.trim() || isSubmitting}
        onSubmit={() => {
          void submitRenameSlotModal();
        }}
      >
        <label className="block text-xs font-medium text-zinc-300">
          새 이름
        </label>
        <input
          value={renameSlotDraft}
          onChange={(e) => setRenameSlotDraft(e.target.value)}
          className={`${inputClass} mt-1`}
          autoFocus
        />
      </FormModal>

      {/* ── 삭제 확인 모달 ── */}
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
