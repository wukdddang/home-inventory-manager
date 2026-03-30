"use client";

import { MotionModalLayer } from "@/app/_ui/motion-modal-layer";
import { toast } from "@/hooks/use-toast";
import { sortHouseholdKindDefinitions } from "@/lib/household-kind-defaults";
import { cn } from "@/lib/utils";
import type { HouseholdKindDefinition } from "@/types/domain";
import { Reorder, useDragControls } from "framer-motion";
import { useId, useMemo, useState } from "react";
import { useDashboard } from "../_hooks/useDashboard";
import { newEntityId } from "../_lib/dashboard-helpers";

export type HouseholdKindsManageModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/* ─── 아이콘 ─── */

function GripIcon({ className }: { className?: string }) {
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
        d="M3.75 9h16.5m-16.5 6.75h16.5"
      />
    </svg>
  );
}

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

function ArrowRightIcon({ className }: { className?: string }) {
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
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
      />
    </svg>
  );
}

/* ─── 드래그 가능한 행 ─── */

function DraggableRow({
  row,
  canDelete,
  onLabelChange,
  onDelete,
}: {
  row: HouseholdKindDefinition;
  canDelete: boolean;
  onLabelChange: (id: string, label: string) => void;
  onDelete: (id: string) => void;
}) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={row}
      dragListener={false}
      dragControls={controls}
      className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2"
      whileDrag={{
        scale: 1.02,
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        borderColor: "rgba(20,184,166,0.4)",
      }}
    >
      <button
        type="button"
        className="cursor-grab touch-none rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300 active:cursor-grabbing"
        onPointerDown={(e) => controls.start(e)}
        aria-label="드래그하여 순서 변경"
      >
        <GripIcon />
      </button>
      <input
        value={row.label}
        onChange={(e) => onLabelChange(row.id, e.target.value)}
        className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500"
        aria-label={`유형 ${row.label} 표시 이름`}
      />
      <button
        type="button"
        disabled={!canDelete}
        onClick={() => onDelete(row.id)}
        className="cursor-pointer rounded-lg p-2 text-zinc-300 transition-colors hover:bg-rose-500/15 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-30"
        aria-label={`${row.label} 유형 삭제`}
      >
        <TrashIcon />
      </button>
    </Reorder.Item>
  );
}

/* ─── 저장 확인 모달 (AS-IS → TO-BE) ─── */

/** AS-IS / TO-BE 각 행의 상태를 나타내는 뱃지 스타일 */
function KindRow({
  label,
  index,
  statuses,
}: {
  label: string;
  index: number;
  statuses?: Set<"added" | "removed" | "renamed" | "moved">;
}) {
  const added = statuses?.has("added");
  const removed = statuses?.has("removed");
  const renamed = statuses?.has("renamed");
  const moved = statuses?.has("moved");
  const unchanged = !statuses || statuses.size === 0;

  return (
    <li
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm",
        removed && "bg-rose-500/8 line-through opacity-50",
        added && "bg-teal-500/10",
        !added && !removed && renamed && "bg-amber-500/8",
        !added && !removed && !renamed && moved && "bg-indigo-500/8",
        unchanged && "opacity-60",
      )}
    >
      <span className="w-5 text-center text-xs tabular-nums text-zinc-500">
        {index + 1}
      </span>
      <span
        className={cn(
          "text-zinc-200",
          removed && "text-rose-300",
          added && "text-teal-200",
          renamed && !added && "text-amber-200",
        )}
      >
        {label}
      </span>
      <span className="ml-auto flex gap-1">
        {added && (
          <span className="rounded bg-teal-500/20 px-1.5 py-0.5 text-[10px] font-medium text-teal-300">
            추가
          </span>
        )}
        {removed && (
          <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-medium text-rose-300">
            삭제
          </span>
        )}
        {renamed && !added && (
          <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
            이름
          </span>
        )}
        {moved && !added && !removed && (
          <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-medium text-indigo-300">
            순서
          </span>
        )}
      </span>
    </li>
  );
}

function SaveConfirmModal({
  open,
  onOpenChange,
  original,
  next,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  original: HouseholdKindDefinition[];
  next: HouseholdKindDefinition[];
  onConfirm: () => void;
}) {
  const titleId = useId().replace(/:/g, "");
  const nextIds = new Set(next.map((d) => d.id));
  const origMap = new Map(original.map((d) => [d.id, d]));

  return (
    <MotionModalLayer
      open={open}
      onOpenChange={onOpenChange}
      closeOnOverlayClick
      zOffset={2}
      panelClassName="fixed left-1/2 top-1/2 z-10043 w-[min(100vw-2rem,36rem)] -translate-x-1/2 -translate-y-1/2 outline-none"
      ariaLabelledBy={titleId}
    >
      {open ? (
        <div className="flex flex-col rounded-2xl border border-zinc-700 bg-zinc-900 shadow-xl">
          <div className="border-b border-zinc-800 p-5 pb-3">
            <h3 id={titleId} className="text-base font-semibold text-white">
              이렇게 변경됩니다
            </h3>
          </div>

          <div className="grid max-h-72 grid-cols-[1fr_auto_1fr] gap-0 overflow-y-auto">
            {/* AS-IS */}
            <div className="flex flex-col border-r border-zinc-800 px-4 py-3">
              <span className="mb-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                현재
              </span>
              <ol className="space-y-1">
                {original.map((row, i) => (
                  <KindRow
                    key={row.id}
                    label={row.label}
                    index={i}
                    statuses={
                      !nextIds.has(row.id) ? new Set(["removed"]) : undefined
                    }
                  />
                ))}
              </ol>
            </div>

            {/* 화살표 구분선 */}
            <div className="flex items-center px-2 text-zinc-600">
              <ArrowRightIcon className="size-5" />
            </div>

            {/* TO-BE */}
            <div className="flex flex-col px-4 py-3">
              <span className="mb-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                변경 후
              </span>
              <ol className="space-y-1">
                {next.map((row, i) => {
                  const orig = origMap.get(row.id);
                  const s = new Set<"added" | "renamed" | "moved">();
                  if (!orig) {
                    s.add("added");
                  } else {
                    if (orig.label !== row.label) s.add("renamed");
                    if (original.indexOf(orig) !== i) s.add("moved");
                  }
                  return (
                    <KindRow
                      key={row.id}
                      label={row.label}
                      index={i}
                      statuses={s.size > 0 ? s : undefined}
                    />
                  );
                })}
              </ol>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-zinc-800 p-5 pt-3">
            <button
              type="button"
              className="cursor-pointer rounded-xl border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
              onClick={() => onOpenChange(false)}
            >
              취소
            </button>
            <button
              type="button"
              className="cursor-pointer rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-teal-400"
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              저장
            </button>
          </div>
        </div>
      ) : null}
    </MotionModalLayer>
  );
}

/* ─── 모달 본문 ─── */

type HouseholdKindsManageModalBodyProps = {
  householdKindDefinitions: HouseholdKindDefinition[];
  거점_유형_정의를_교체_한다: (next: HouseholdKindDefinition[]) => void;
  onOpenChange: (open: boolean) => void;
  titleId: string;
  descId: string;
};

/** `open`일 때만 마운트되어 초기 `draft`가 최신 정의로 잡힙니다(effect로 동기화할 필요 없음). */
function HouseholdKindsManageModalBody({
  householdKindDefinitions,
  거점_유형_정의를_교체_한다,
  onOpenChange,
  titleId,
  descId,
}: HouseholdKindsManageModalBodyProps) {
  const original = useMemo(
    () => sortHouseholdKindDefinitions(structuredClone(householdKindDefinitions)),
    [householdKindDefinitions],
  );

  const [draft, setDraft] = useState<HouseholdKindDefinition[]>(() =>
    sortHouseholdKindDefinitions(structuredClone(householdKindDefinitions)),
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleLabelChange = (id: string, label: string) => {
    setDraft((rows) =>
      rows.map((r) => (r.id === id ? { ...r, label } : r)),
    );
  };

  const handleDelete = (id: string) => {
    setDraft((rows) => rows.filter((r) => r.id !== id));
  };

  const handleAddRow = () => {
    setDraft((rows) => [
      ...rows,
      {
        id: newEntityId(),
        label: "새 유형",
        sortOrder: rows.length,
      },
    ]);
  };

  const cleaned = useMemo(
    () =>
      draft
        .map((d, i) => ({
          id: d.id.trim(),
          label: d.label.trim(),
          sortOrder: i,
        }))
        .filter((d) => d.id && d.label),
    [draft],
  );

  const hasChanges = useMemo(() => {
    if (original.length !== cleaned.length) return true;
    return original.some(
      (o, i) => o.id !== cleaned[i].id || o.label !== cleaned[i].label,
    );
  }, [original, cleaned]);

  const handleSave = () => {
    if (cleaned.length === 0) return;
    거점_유형_정의를_교체_한다(cleaned);
    toast({ title: "거점 유형을 저장했습니다" });
    onOpenChange(false);
  };

  const saveDisabled =
    cleaned.length === 0 ||
    draft.every((d) => !d.label.trim()) ||
    draft.some((d) => !d.id.trim());

  return (
    <>
      <div className="flex max-h-[min(90vh,36rem)] flex-col rounded-2xl border border-zinc-700 bg-zinc-900 shadow-xl">
        <div className="shrink-0 border-b border-zinc-800 p-6 pb-4">
          <h2 id={titleId} className="text-lg font-semibold text-white">
            거점 유형 관리
          </h2>
          <p id={descId} className="mt-2 text-sm text-zinc-300">
            드래그하여 순서를 바꾸거나, 유형을 추가·삭제할 수 있습니다. 삭제한
            유형을 쓰던 거점은 목록의 첫 유형으로 옮깁니다.
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <Reorder.Group
            axis="y"
            values={draft}
            onReorder={setDraft}
            className="space-y-2"
          >
            {draft.map((row) => (
              <DraggableRow
                key={row.id}
                row={row}
                canDelete={draft.length > 1}
                onLabelChange={handleLabelChange}
                onDelete={handleDelete}
              />
            ))}
          </Reorder.Group>
          <button
            type="button"
            onClick={handleAddRow}
            className="mt-3 w-full cursor-pointer rounded-xl border border-dashed border-zinc-600 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-teal-500/50 hover:bg-teal-500/5 hover:text-teal-200"
          >
            + 유형 추가
          </button>
        </div>
        <div className="flex shrink-0 justify-end gap-2 border-t border-zinc-800 p-6 pt-4">
          <button
            type="button"
            className="cursor-pointer rounded-xl border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
            onClick={() => onOpenChange(false)}
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => {
              if (!hasChanges) {
                onOpenChange(false);
                return;
              }
              setConfirmOpen(true);
            }}
            disabled={saveDisabled}
            className="cursor-pointer rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            저장
          </button>
        </div>
      </div>

      <SaveConfirmModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        original={original}
        next={cleaned}
        onConfirm={handleSave}
      />
    </>
  );
}

/**
 * 거점 유형(라벨) 추가·삭제·수정. `/dashboard` 헤더와 `/settings`에서 공통 사용.
 */
export function HouseholdKindsManageModal({
  open,
  onOpenChange,
}: HouseholdKindsManageModalProps) {
  const { householdKindDefinitions, 거점_유형_정의를_교체_한다 } =
    useDashboard();

  const titleId = useId().replace(/:/g, "");
  const descId = useId().replace(/:/g, "");

  return (
    <MotionModalLayer
      open={open}
      onOpenChange={onOpenChange}
      closeOnOverlayClick
      panelClassName="fixed left-1/2 top-1/2 z-10041 w-[min(100vw-2rem,32rem)] max-h-[min(90vh,36rem)] -translate-x-1/2 -translate-y-1/2 outline-none"
      ariaLabelledBy={titleId}
      ariaDescribedBy={descId}
    >
      {open ? (
        <HouseholdKindsManageModalBody
          householdKindDefinitions={householdKindDefinitions}
          거점_유형_정의를_교체_한다={거점_유형_정의를_교체_한다}
          onOpenChange={onOpenChange}
          titleId={titleId}
          descId={descId}
        />
      ) : null}
    </MotionModalLayer>
  );
}
