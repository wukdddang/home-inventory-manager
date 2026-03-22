"use client";

import { AlertModal } from "@/app/_ui/alert-modal";
import { MotionModalLayer } from "@/app/_ui/motion-modal-layer";
import {
  getHouseholdKindLabel,
  sortHouseholdKindDefinitions,
} from "@/lib/household-kind-defaults";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useId, useState } from "react";
import { useDashboard } from "../../_hooks/useDashboard";
import { HouseholdKindsManageModal } from "../HouseholdKindsManage.modal";

type DashboardHouseholdsHeaderProps = {
  selectedHouseholdId: string | null;
  onSelectHousehold: (id: string) => void;
  onAfterAddHousehold: (id: string) => void;
  onDeleteHousehold: (id: string) => void;
};

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

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={cn("size-5", className)}
      aria-hidden
    >
      <path strokeLinecap="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function CogIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={cn("size-5", className)}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  );
}

export function DashboardHouseholdsHeader({
  selectedHouseholdId,
  onSelectHousehold,
  onAfterAddHousehold,
  onDeleteHousehold,
}: DashboardHouseholdsHeaderProps) {
  const { households, householdKindDefinitions, 거점을_추가_한다 } =
    useDashboard();
  const [kindsManageOpen, setKindsManageOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newHouseName, setNewHouseName] = useState("");
  const [newHouseKind, setNewHouseKind] = useState("");
  const [pendingDeleteHouseholdId, setPendingDeleteHouseholdId] = useState<
    string | null
  >(null);

  const addTitleId = useId().replace(/:/g, "");
  const addDescId = useId().replace(/:/g, "");

  const kindOptions = sortHouseholdKindDefinitions(householdKindDefinitions);
  const defaultKindId = kindOptions[0]?.id ?? "";

  useEffect(() => {
    if (!addOpen) return;
    setNewHouseName("");
    setNewHouseKind(defaultKindId);
  }, [addOpen, defaultKindId]);

  const handleAddHousehold = () => {
    const trimmed = newHouseName.trim();
    if (!trimmed) return;
    const id = 거점을_추가_한다(trimmed, newHouseKind);
    onAfterAddHousehold(id);
    setAddOpen(false);
  };

  const pendingDeleteHousehold = pendingDeleteHouseholdId
    ? households.find((h) => h.id === pendingDeleteHouseholdId)
    : null;

  return (
    <header className="shrink-0 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-base font-semibold text-white sm:text-lg">
            내 거점
          </h1>
          <p className="mt-0.5 text-xs text-zinc-500 sm:text-sm">
            탭으로 거점을 전환하고, + 로 새 거점을 추가합니다.
          </p>
        </div>
      </div>

      <div className="mt-4 flex min-w-0 items-stretch gap-2">
        <div
          role="tablist"
          aria-label="거점 선택"
          className="flex min-h-11 min-w-0 flex-1 items-center gap-1 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/80 p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {households.length === 0 ? (
            <p className="px-3 py-2 text-sm text-zinc-500">
              등록된 거점이 없습니다. 오른쪽 + 를 눌러 추가하세요.
            </p>
          ) : (
            households.map((h) => {
              const selected = h.id === selectedHouseholdId;
              return (
                <div
                  key={h.id}
                  className="relative flex shrink-0 items-center overflow-hidden rounded-lg"
                >
                  {selected ? (
                    <motion.div
                      layoutId="dashboard-households-tab-selection"
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
                    aria-selected={selected}
                    onClick={() => onSelectHousehold(h.id)}
                    className={cn(
                      "relative z-10 cursor-pointer px-3 py-2 text-left text-sm font-medium transition-colors",
                      selected ? "text-teal-100" : "text-zinc-300 hover:text-white",
                    )}
                  >
                    <span className="whitespace-nowrap">{h.name}</span>
                    <span
                      className={cn(
                        "ml-2 text-xs font-normal",
                        selected ? "text-teal-200/80" : "text-zinc-500",
                      )}
                    >
                      {getHouseholdKindLabel(h.kind, householdKindDefinitions)}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingDeleteHouseholdId(h.id);
                    }}
                    className="relative z-10 cursor-pointer rounded-md p-2 text-zinc-500 transition-colors hover:bg-rose-500/15 hover:text-rose-300"
                    aria-label={`${h.name} 삭제`}
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
          onClick={() => setKindsManageOpen(true)}
          className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-zinc-600 bg-zinc-950 text-zinc-400 transition-colors hover:border-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
          aria-label="거점 유형 관리"
        >
          <CogIcon />
        </button>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-teal-500/40 bg-teal-500/10 text-teal-300 transition-colors hover:bg-teal-500/20 hover:text-teal-100"
          aria-label="거점 추가"
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
        <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
          <h2 id={addTitleId} className="text-lg font-semibold text-white">
            거점 추가
          </h2>
          <p id={addDescId} className="mt-2 text-sm text-zinc-400">
            집·사무실·차량 등 유형을 고르고 이름을 입력한 뒤 추가합니다.
          </p>
          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400">
                거점 이름
              </label>
              <input
                value={newHouseName}
                onChange={(e) => setNewHouseName(e.target.value)}
                placeholder="예: 우리 집"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400">유형</label>
              <select
                value={newHouseKind}
                onChange={(e) => setNewHouseKind(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500"
              >
                {kindOptions.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                className="cursor-pointer rounded-xl border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
                onClick={() => setAddOpen(false)}
              >
                취소
              </button>
              <button
                type="button"
                disabled={!newHouseName.trim() || !newHouseKind}
                onClick={handleAddHousehold}
                className="cursor-pointer rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      </MotionModalLayer>

      <HouseholdKindsManageModal
        open={kindsManageOpen}
        onOpenChange={setKindsManageOpen}
      />

      <AlertModal
        open={pendingDeleteHouseholdId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteHouseholdId(null);
        }}
        title="거점 삭제"
        description={
          pendingDeleteHousehold
            ? `삭제하시겠습니까? 「${pendingDeleteHousehold.name}」과(와) 소속 방·물품 데이터가 함께 제거됩니다. 이 작업은 되돌릴 수 없습니다.`
            : "삭제하시겠습니까?"
        }
        confirmLabel="삭제"
        cancelLabel="취소"
        variant="danger"
        onConfirm={() => {
          if (pendingDeleteHouseholdId) {
            onDeleteHousehold(pendingDeleteHouseholdId);
          }
          setPendingDeleteHouseholdId(null);
        }}
      />
    </header>
  );
}
