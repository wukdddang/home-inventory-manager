"use client";

import { AlertModal } from "@/app/_ui/alert-modal";
import { MotionModalLayer } from "@/app/_ui/motion-modal-layer";
import {
  getHouseholdKindLabel,
  sortHouseholdKindDefinitions,
} from "@/lib/household-kind-defaults";
import { useAppRoutePrefix } from "@/lib/use-app-route-prefix";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { FormModal } from "@/app/_ui/form-modal";
import { toast } from "@/hooks/use-toast";
import type { GroupMember, MemberRole } from "@/types/domain";
import { useDashboard } from "../../_hooks/useDashboard";
import { HouseholdKindsManageModal } from "../HouseholdKindsManage.modal";

/** 거점(사이트·기지) */
function HouseholdSectionIcon({ className }: { className?: string }) {
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
        d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.75H15V21"
      />
    </svg>
  );
}

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

function InfoCircleIcon({ className }: { className?: string }) {
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
        d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
      />
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
      className={cn("size-4", className)}
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

function DashboardScreenHelpHint() {
  const prefix = useAppRoutePrefix();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative inline-flex shrink-0 translate-y-px">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex size-6 cursor-pointer items-center justify-center rounded-full border border-zinc-600/90 bg-zinc-950 p-0 text-zinc-300 transition-colors hover:border-teal-500/50 hover:text-teal-300"
        aria-label="이 화면 안내"
      >
        <InfoCircleIcon className="size-3.5" />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            key="dashboard-screen-help-hint"
            role="tooltip"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{
              type: "spring",
              stiffness: 520,
              damping: 32,
              mass: 0.7,
            }}
            className="absolute left-0 top-full z-100 mt-1.5 w-[min(calc(100vw-2rem),22rem)] origin-top-left rounded-lg border border-zinc-600 bg-zinc-950 p-2.5 text-xs leading-relaxed text-zinc-300 shadow-xl ring-1 ring-black sm:text-sm"
          >
            <span className="font-medium text-zinc-200">이 화면</span>에서는 방·보관
            장소에 재고를 바로 맞춥니다. 장만 하고 보관 장소 정리는 나중이면{" "}
            <Link
              href={`${prefix}/purchases`}
              className="font-medium text-teal-400 underline-offset-2 hover:underline"
              onClick={() => setOpen(false)}
            >
              구매·로트
            </Link>
            에서 유통기한·로트만 먼저 적어 두면 됩니다.
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  admin: "관리자",
  editor: "편집자",
  viewer: "조회자",
};

const MEMBER_AVATAR_COLORS: Record<MemberRole, string> = {
  admin: "bg-amber-500/25 text-amber-200 ring-amber-500/40",
  editor: "bg-blue-500/20 text-blue-200 ring-blue-500/35",
  viewer: "bg-zinc-700/60 text-zinc-300 ring-zinc-600",
};

function MemberAvatarBadge({
  label,
  role,
}: {
  label: string;
  role: MemberRole;
}) {
  const initial = (label || "?")[0]!.toUpperCase();
  return (
    <span
      title={`${label} (${MEMBER_ROLE_LABELS[role]})`}
      className={cn(
        "inline-flex size-6 items-center justify-center rounded-full text-[10px] font-semibold ring-1",
        MEMBER_AVATAR_COLORS[role],
      )}
    >
      {initial}
    </span>
  );
}

const memberInputClass =
  "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30";

function CandidateRow({
  candidate,
  alreadyAdded,
  onPick,
}: {
  candidate: GroupMember;
  alreadyAdded: boolean;
  onPick: (c: GroupMember, role: MemberRole) => void;
}) {
  const [role, setRole] = useState<MemberRole>("editor");

  return (
    <li className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-zinc-200">
          {candidate.label ?? candidate.email}
        </p>
        {candidate.label && (
          <p className="truncate text-xs text-zinc-500">{candidate.email}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        {alreadyAdded ? (
          <span className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-500">
            추가됨
          </span>
        ) : (
          <>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as MemberRole)}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-teal-500"
            >
              <option value="viewer">조회자</option>
              <option value="editor">편집자</option>
              <option value="admin">관리자</option>
            </select>
            <button
              type="button"
              onClick={() => onPick(candidate, role)}
              className="cursor-pointer rounded-lg bg-teal-500/15 px-3 py-1.5 text-xs font-semibold text-teal-300 ring-1 ring-teal-500/40 transition-colors hover:bg-teal-500/25"
            >
              추가
            </button>
          </>
        )}
      </div>
    </li>
  );
}

type AddMemberTab = "direct" | "list" | "invite";

/** 다른 거점에 소속된 사용자 중 현재 거점에 없는 후보 목록 */
function useKnownMemberCandidates(
  selectedHouseholdId: string | null,
  households: { id: string; members?: GroupMember[] }[],
) {
  return useMemo(() => {
    if (!selectedHouseholdId) return [];
    const current = households.find((h) => h.id === selectedHouseholdId);
    const currentEmails = new Set(
      (current?.members ?? []).map((m) => m.email.toLowerCase()),
    );
    const seen = new Set<string>();
    const candidates: GroupMember[] = [];
    for (const h of households) {
      if (h.id === selectedHouseholdId) continue;
      for (const m of h.members ?? []) {
        const key = m.email.toLowerCase();
        if (currentEmails.has(key) || seen.has(key)) continue;
        seen.add(key);
        candidates.push(m);
      }
    }
    return candidates;
  }, [selectedHouseholdId, households]);
}

function HouseholdMembersSummary({
  selectedHouseholdId,
}: {
  selectedHouseholdId: string | null;
}) {
  const { households, 거점을_갱신_한다 } = useDashboard();
  const selected = useMemo(
    () => households.find((h) => h.id === selectedHouseholdId) ?? null,
    [households, selectedHouseholdId],
  );
  const members = selected?.members ?? [];
  const candidates = useKnownMemberCandidates(selectedHouseholdId, households);

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [tab, setTab] = useState<AddMemberTab>("direct");
  const [email, setEmail] = useState("");
  const [label, setLabel] = useState("");
  const [role, setRole] = useState<MemberRole>("editor");
  const [listSearch, setListSearch] = useState("");
  const [inviteLinkRole, setInviteLinkRole] = useState<MemberRole>("editor");
  const [inviteLinkUrl, setInviteLinkUrl] = useState<string | null>(null);
  const [inviteMailTo, setInviteMailTo] = useState("");

  const resetFields = useCallback(() => {
    setEmail("");
    setLabel("");
    setRole("editor");
    setListSearch("");
    setInviteLinkRole("editor");
    setInviteLinkUrl(null);
    setInviteMailTo("");
  }, []);

  const 멤버를_추가_한다 = useCallback(
    (newMember: GroupMember) => {
      if (!selected) return;
      거점을_갱신_한다(selected.id, (h) => ({
        ...h,
        members: [...(h.members ?? []), newMember],
      }));
      toast({
        title: "멤버를 추가했습니다",
        description: `${selected.name} · ${newMember.label ?? newMember.email}`,
      });
    },
    [selected, 거점을_갱신_한다],
  );

  const handleDirectSubmit = useCallback(() => {
    if (!selected) return;
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      toast({ title: "이메일을 입력하세요", variant: "warning" });
      return;
    }
    if (members.some((m) => m.email.toLowerCase() === trimmedEmail)) {
      toast({ title: "이미 추가된 이메일입니다", variant: "warning" });
      return;
    }
    멤버를_추가_한다({
      id: crypto.randomUUID(),
      email: email.trim(),
      role,
      label: label.trim() || undefined,
    });
    resetFields();
    setAddMemberOpen(false);
  }, [selected, email, label, role, members, 멤버를_추가_한다, resetFields]);

  const handlePickFromList = useCallback(
    (candidate: GroupMember, pickedRole: MemberRole) => {
      if (!selected) return;
      if (members.some((m) => m.email.toLowerCase() === candidate.email.toLowerCase())) {
        toast({ title: "이미 추가된 이메일입니다", variant: "warning" });
        return;
      }
      멤버를_추가_한다({
        id: crypto.randomUUID(),
        email: candidate.email,
        role: pickedRole,
        label: candidate.label,
      });
    },
    [selected, members, 멤버를_추가_한다],
  );

  const filteredCandidates = useMemo(() => {
    const q = listSearch.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter(
      (m) =>
        m.email.toLowerCase().includes(q) ||
        (m.label ?? "").toLowerCase().includes(q),
    );
  }, [candidates, listSearch]);

  const MAX_SHOW = 5;
  const visible = members.slice(0, MAX_SHOW);
  const extra = members.length - MAX_SHOW;

  return (
    <>
      <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2 px-0.5">
        {members.length > 0 && (
          <>
            <div className="flex items-center -space-x-1.5">
              {visible.map((m) => (
                <MemberAvatarBadge
                  key={m.id}
                  label={m.label ?? m.email}
                  role={m.role}
                />
              ))}
              {extra > 0 && (
                <span className="inline-flex size-6 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-medium text-zinc-400 ring-1 ring-zinc-700">
                  +{extra}
                </span>
              )}
            </div>
            <p className="text-xs leading-snug text-zinc-400">
              {members
                .map(
                  (m) =>
                    `${m.label ?? m.email.split("@")[0]}(${MEMBER_ROLE_LABELS[m.role]})`,
                )
                .join(", ")}
              가 함께 사용합니다
            </p>
          </>
        )}
        {selected && (
          <button
            type="button"
            onClick={() => {
              resetFields();
              setTab("direct");
              setAddMemberOpen(true);
            }}
            className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-zinc-300 transition-colors hover:border-teal-500/40 hover:text-teal-300"
          >
            <PlusIcon className="size-3" />
            멤버 추가
          </button>
        )}
      </div>

      <FormModal
        open={addMemberOpen}
        onOpenChange={(open) => {
          setAddMemberOpen(open);
          if (!open) resetFields();
        }}
        title="멤버 추가"
        description={
          selected
            ? `대상 거점: ${selected.name}`
            : ""
        }
        submitLabel={tab === "direct" ? "추가" : undefined}
        cancelLabel="닫기"
        onSubmit={tab === "direct" ? handleDirectSubmit : undefined}
        submitDisabled={tab === "direct" ? !email.trim() : true}
      >
        <div className="space-y-4">
          {/* 탭 전환 */}
          <div className="flex rounded-lg border border-zinc-700 bg-zinc-950 p-0.5">
            {(
              [
                { key: "direct", label: "직접 추가" },
                { key: "list", label: "목록에서 추가", badge: candidates.length || undefined },
                { key: "invite", label: "초대 링크 · 메일" },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                  tab === t.key
                    ? "bg-teal-500/15 text-teal-200 ring-1 ring-teal-500/40"
                    : "cursor-pointer text-zinc-400 hover:text-zinc-200",
                )}
              >
                {t.label}
                {"badge" in t && t.badge != null && (
                  <span className="ml-1 text-[10px] text-zinc-500">
                    ({t.badge})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── 직접 추가 탭 ── */}
          {tab === "direct" && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-zinc-300">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={memberInputClass}
                  placeholder="member@example.com"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-300">표시 이름 (선택)</label>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className={memberInputClass}
                  placeholder="엄마, 동료…"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-300">역할</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as MemberRole)}
                  className={memberInputClass}
                >
                  <option value="viewer">조회자 — 조회만</option>
                  <option value="editor">편집자 — 조회 · 추가 · 수정</option>
                  <option value="admin">관리자 — 전체 + 멤버 관리</option>
                </select>
              </div>
            </div>
          )}

          {/* ── 목록에서 추가 탭 ── */}
          {tab === "list" && (
            <div className="space-y-3">
              <input
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                className={memberInputClass}
                placeholder="이메일 · 이름 검색…"
              />

              {filteredCandidates.length === 0 ? (
                <p className="py-6 text-center text-sm text-zinc-500">
                  {candidates.length === 0
                    ? "다른 거점에 등록된 사용자가 없습니다."
                    : "검색 결과가 없습니다."}
                </p>
              ) : (
                <ul className="max-h-64 divide-y divide-zinc-800 overflow-y-auto rounded-xl border border-zinc-800">
                  {filteredCandidates.map((c) => (
                    <CandidateRow
                      key={c.email}
                      candidate={c}
                      alreadyAdded={members.some(
                        (m) => m.email.toLowerCase() === c.email.toLowerCase(),
                      )}
                      onPick={handlePickFromList}
                    />
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ── 초대 링크 · 메일 탭 ── */}
          {tab === "invite" && (
            <div className="space-y-5">
              {/* 초대 링크 */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-zinc-200">초대 링크 생성</p>
                <p className="text-xs text-zinc-500">
                  링크를 받은 사람이 아래 역할로 거점에 참여합니다. (모의 데모)
                </p>
                <div className="flex items-center gap-2">
                  <select
                    value={inviteLinkRole}
                    onChange={(e) => {
                      setInviteLinkRole(e.target.value as MemberRole);
                      setInviteLinkUrl(null);
                    }}
                    className={cn(memberInputClass, "flex-1")}
                  >
                    <option value="viewer">조회자 — 조회만</option>
                    <option value="editor">편집자 — 조회 · 추가 · 수정</option>
                    <option value="admin">관리자 — 전체 + 멤버 관리</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const token = crypto.randomUUID().slice(0, 8);
                      const url = `${typeof window !== "undefined" ? window.location.origin : ""}/mock/invite/${token}`;
                      setInviteLinkUrl(url);
                      void navigator.clipboard.writeText(url);
                      toast({ title: "초대 링크를 클립보드에 복사했습니다" });
                    }}
                    className="shrink-0 cursor-pointer rounded-xl bg-teal-500/15 px-4 py-2 text-xs font-semibold text-teal-300 ring-1 ring-teal-500/40 transition-colors hover:bg-teal-500/25"
                  >
                    {inviteLinkUrl ? "다시 생성" : "링크 생성 · 복사"}
                  </button>
                </div>
                {inviteLinkUrl && (
                  <div
                    className="flex cursor-pointer items-center gap-2 rounded-lg bg-zinc-950 px-3 py-2 ring-1 ring-zinc-800 transition-colors hover:ring-teal-500/30"
                    onClick={() => {
                      void navigator.clipboard.writeText(inviteLinkUrl);
                      toast({ title: "클립보드에 복사했습니다" });
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <p className="min-w-0 flex-1 truncate text-xs text-zinc-400">
                      {inviteLinkUrl}
                    </p>
                    <span className="shrink-0 text-[10px] text-zinc-500">클릭하여 복사</span>
                  </div>
                )}
              </div>

              <div className="border-t border-zinc-800" />

              {/* 메일 전송 */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-zinc-200">메일로 초대</p>
                <p className="text-xs text-zinc-500">
                  초대 링크가 포함된 메일을 보냅니다. (모의: 메일 클라이언트가 열립니다)
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={inviteMailTo}
                    onChange={(e) => setInviteMailTo(e.target.value)}
                    className={cn(memberInputClass, "flex-1")}
                    placeholder="초대할 이메일 주소"
                  />
                  <button
                    type="button"
                    disabled={!inviteMailTo.trim()}
                    onClick={() => {
                      const link = inviteLinkUrl ?? `${typeof window !== "undefined" ? window.location.origin : ""}/mock/invite/${crypto.randomUUID().slice(0, 8)}`;
                      if (!inviteLinkUrl) setInviteLinkUrl(link);
                      const householdName = selected?.name ?? "거점";
                      const subject = encodeURIComponent(`[집비치기] ${householdName}에 초대합니다`);
                      const body = encodeURIComponent(
                        `안녕하세요!\n\n「${householdName}」 거점에 초대합니다.\n아래 링크를 클릭하여 참여하세요:\n\n${link}\n\n역할: ${MEMBER_ROLE_LABELS[inviteLinkRole]}`,
                      );
                      window.open(`mailto:${inviteMailTo.trim()}?subject=${subject}&body=${body}`, "_self");
                      toast({ title: "메일 클라이언트를 여는 중…" });
                    }}
                    className="shrink-0 cursor-pointer rounded-xl bg-blue-500/15 px-4 py-2 text-xs font-semibold text-blue-300 ring-1 ring-blue-500/40 transition-colors hover:bg-blue-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    메일 보내기
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </FormModal>
    </>
  );
}

export function DashboardHouseholdsHeader({
  selectedHouseholdId,
  onSelectHousehold,
  onAfterAddHousehold,
  onDeleteHousehold,
}: DashboardHouseholdsHeaderProps) {
  const {
    households,
    householdKindDefinitions,
    거점을_추가_한다,
    거점을_갱신_한다,
    거점_기본정보를_수정_한다,
  } = useDashboard();
  const [kindsManageOpen, setKindsManageOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addStep, setAddStep] = useState<1 | 2>(1);
  const [newHouseName, setNewHouseName] = useState("");
  const [newHouseKind, setNewHouseKind] = useState("");
  const [createdHouseholdId, setCreatedHouseholdId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLabel, setInviteLabel] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("editor");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [pendingDeleteHouseholdId, setPendingDeleteHouseholdId] = useState<
    string | null
  >(null);

  // 우클릭 컨텍스트 메뉴
  const [contextMenu, setContextMenu] = useState<{
    householdId: string;
    x: number;
    y: number;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // 거점 이름 수정 모달
  const [editHouseholdId, setEditHouseholdId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const editHousehold = editHouseholdId
    ? households.find((h) => h.id === editHouseholdId)
    : null;

  // 컨텍스트 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target as Node)
      ) {
        setContextMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [contextMenu]);

  const addTitleId = useId().replace(/:/g, "");
  const addDescId = useId().replace(/:/g, "");

  const kindOptions = sortHouseholdKindDefinitions(householdKindDefinitions);
  const defaultKindId = kindOptions[0]?.id ?? "";

  useEffect(() => {
    if (!addOpen) return;
    setNewHouseName("");
    setNewHouseKind(defaultKindId);
    setAddStep(1);
    setCreatedHouseholdId(null);
    setInviteEmail("");
    setInviteLabel("");
    setInviteRole("editor");
    setInviteLink(null);
  }, [addOpen, defaultKindId]);

  const handleAddHousehold = async () => {
    const trimmed = newHouseName.trim();
    if (!trimmed) return;
    const id = await 거점을_추가_한다(trimmed, newHouseKind);
    setCreatedHouseholdId(id);
    onAfterAddHousehold(id);
    setAddStep(2);
  };

  const handleInviteMember = () => {
    if (!createdHouseholdId) return;
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    거점을_갱신_한다(createdHouseholdId, (h) => ({
      ...h,
      members: [
        ...(h.members ?? []),
        {
          id: crypto.randomUUID(),
          email: inviteEmail.trim(),
          role: inviteRole,
          label: inviteLabel.trim() || undefined,
        },
      ],
    }));
    setInviteEmail("");
    setInviteLabel("");
    setInviteRole("editor");
  };

  const handleGenerateInviteLink = () => {
    const token = crypto.randomUUID().slice(0, 8);
    const mockUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/mock/invite/${token}`;
    setInviteLink(mockUrl);
    void navigator.clipboard.writeText(mockUrl);
  };

  const handleFinishAdd = () => {
    setAddOpen(false);
  };

  const pendingDeleteHousehold = pendingDeleteHouseholdId
    ? households.find((h) => h.id === pendingDeleteHouseholdId)
    : null;

  return (
    <header className="shrink-0 rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-3 sm:px-4">
      {/* z-index: 툴팁이 아래쪽 형제(거점 탭·멤버 줄)보다 위에 그려지도록 — 형제 순서만으로는 탭이 툴팁을 덮음 */}
      <div className="relative z-30 min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <HouseholdSectionIcon />
          <h1 className="text-sm font-semibold tracking-tight text-white sm:text-base">
            내 거점
          </h1>
          <DashboardScreenHelpHint />
        </div>
        <p className="mt-1 text-xs leading-snug text-zinc-300 sm:text-xs">
          탭으로 거점을 전환하고, + 로 새 거점을 추가합니다.
        </p>
      </div>

      <div className="relative z-10 mt-3 flex min-w-0 items-stretch gap-1.5">
        <div
          role="tablist"
          aria-label="거점 선택"
          className="flex min-h-9 min-w-0 flex-1 items-center gap-0.5 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950/80 p-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {households.length === 0 ? (
            <p className="px-2.5 py-1.5 text-xs text-zinc-300">
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
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({
                        householdId: h.id,
                        x: e.clientX,
                        y: e.clientY,
                      });
                    }}
                    className={cn(
                      "relative z-10 cursor-pointer px-2.5 py-1.5 text-left text-xs font-medium transition-colors sm:text-sm",
                      selected ? "text-teal-100" : "text-zinc-300 hover:text-white",
                    )}
                  >
                    <span className="whitespace-nowrap">{h.name}</span>
                    <span
                      className={cn(
                        "ml-1.5 text-xs font-normal sm:text-xs",
                        selected ? "text-teal-200/80" : "text-zinc-300",
                      )}
                    >
                      {getHouseholdKindLabel(h.kind, householdKindDefinitions)}
                    </span>
                    {(h.members?.length ?? 0) > 0 && (
                      <span
                        className={cn(
                          "ml-1 inline-flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium",
                          selected
                            ? "bg-teal-500/20 text-teal-200"
                            : "bg-zinc-700/60 text-zinc-400",
                        )}
                      >
                        {h.members!.length}
                      </span>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
        <button
          type="button"
          onClick={() => setKindsManageOpen(true)}
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-zinc-600 bg-zinc-950 text-zinc-300 transition-colors hover:border-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
          aria-label="거점 유형 관리"
        >
          <CogIcon />
        </button>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-teal-500/40 bg-teal-500/10 text-teal-300 transition-colors hover:bg-teal-500/20 hover:text-teal-100"
          aria-label="거점 추가"
        >
          <PlusIcon />
        </button>
      </div>

      <HouseholdMembersSummary selectedHouseholdId={selectedHouseholdId} />

      <MotionModalLayer
        open={addOpen}
        onOpenChange={setAddOpen}
        closeOnOverlayClick={addStep === 1}
        panelClassName="fixed left-1/2 top-1/2 z-10041 w-[min(100vw-2rem,30rem)] -translate-x-1/2 -translate-y-1/2 outline-none"
        ariaLabelledBy={addTitleId}
        ariaDescribedBy={addDescId}
      >
        <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
          {addStep === 1 ? (
            <>
              <h2 id={addTitleId} className="text-lg font-semibold text-white">
                거점 추가
              </h2>
              <p id={addDescId} className="mt-2 text-sm text-zinc-300">
                집·사무실·차량 등 유형을 고르고 이름을 입력한 뒤 추가합니다.
              </p>
              <div className="mt-5 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-300">
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
                  <label className="text-xs font-medium text-zinc-300">유형</label>
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
            </>
          ) : (
            <>
              <h2 id={addTitleId} className="text-lg font-semibold text-white">
                멤버 초대
              </h2>
              <p id={addDescId} className="mt-2 text-sm text-zinc-300">
                새 거점에 멤버를 초대합니다. 나중에 설정에서도 추가할 수 있습니다.
              </p>

              <div className="mt-5 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">이메일</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="member@example.com"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">
                    표시 이름 (선택)
                  </label>
                  <input
                    value={inviteLabel}
                    onChange={(e) => setInviteLabel(e.target.value)}
                    placeholder="엄마, 동료…"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">역할</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as MemberRole)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500"
                  >
                    <option value="viewer">조회자 — 조회만</option>
                    <option value="editor">편집자 — 조회 · 추가 · 수정</option>
                    <option value="admin">관리자 — 전체 + 멤버 관리</option>
                  </select>
                </div>
                <button
                  type="button"
                  disabled={!inviteEmail.trim()}
                  onClick={handleInviteMember}
                  className="w-full cursor-pointer rounded-xl bg-teal-500/15 px-4 py-2 text-sm font-semibold text-teal-300 ring-1 ring-teal-500/40 transition-colors hover:bg-teal-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  멤버 추가
                </button>
              </div>

              <div className="mt-4 border-t border-zinc-800 pt-4">
                <p className="text-xs text-zinc-400">
                  또는 초대 링크를 공유하세요 (모의)
                </p>
                <button
                  type="button"
                  onClick={handleGenerateInviteLink}
                  className="mt-2 w-full cursor-pointer rounded-xl border border-zinc-600 px-4 py-2 text-sm text-zinc-200 transition-colors hover:bg-zinc-800"
                >
                  {inviteLink ? "링크 복사됨!" : "초대 링크 생성 · 복사"}
                </button>
                {inviteLink && (
                  <p className="mt-1.5 break-all text-xs text-zinc-500">
                    {inviteLink}
                  </p>
                )}
              </div>

              {/* 추가된 멤버 미리보기 */}
              {createdHouseholdId && (() => {
                const h = households.find((x) => x.id === createdHouseholdId);
                const members = h?.members ?? [];
                if (members.length === 0) return null;
                return (
                  <div className="mt-4 border-t border-zinc-800 pt-3">
                    <p className="text-xs text-zinc-400">추가된 멤버</p>
                    <ul className="mt-1.5 space-y-1">
                      {members.map((m) => (
                        <li key={m.id} className="flex items-center gap-2 text-xs text-zinc-300">
                          <MemberAvatarBadge label={m.label ?? m.email} role={m.role} />
                          <span>{m.label ?? m.email}</span>
                          <span className="text-zinc-500">({MEMBER_ROLE_LABELS[m.role]})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })()}

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleFinishAdd}
                  className="cursor-pointer rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-teal-400"
                >
                  완료
                </button>
              </div>
            </>
          )}
        </div>
      </MotionModalLayer>

      <HouseholdKindsManageModal
        open={kindsManageOpen}
        onOpenChange={setKindsManageOpen}
      />

      {/* ── 우클릭 컨텍스트 메뉴 ── */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          role="menu"
          aria-label="거점 컨텍스트 메뉴"
          className="fixed z-[10060] min-w-[120px] rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-xl"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-zinc-200 transition-colors hover:bg-zinc-800"
            onClick={() => {
              const h = households.find(
                (h) => h.id === contextMenu.householdId,
              );
              if (h) {
                setEditHouseholdId(h.id);
                setEditName(h.name);
              }
              setContextMenu(null);
            }}
          >
            <PencilIcon />
            수정
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-rose-300 transition-colors hover:bg-zinc-800"
            onClick={() => {
              setPendingDeleteHouseholdId(contextMenu.householdId);
              setContextMenu(null);
            }}
          >
            <TrashIcon />
            삭제
          </button>
        </div>
      )}

      {/* ── 거점 이름 수정 모달 ── */}
      <FormModal
        open={editHouseholdId !== null}
        onOpenChange={(open) => {
          if (!open) setEditHouseholdId(null);
        }}
        title="거점 이름 수정"
        description="거점의 이름을 변경합니다."
        submitLabel="저장"
        submitDisabled={!editName.trim() || editName.trim() === editHousehold?.name}
        onSubmit={async () => {
          if (!editHouseholdId || !editName.trim()) return;
          const h = households.find((h) => h.id === editHouseholdId);
          await 거점_기본정보를_수정_한다(
            editHouseholdId,
            editName.trim(),
            h?.kind ?? "",
          );
          setEditHouseholdId(null);
        }}
      >
        <label className="block text-sm font-medium text-zinc-300">
          거점 이름
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="예: 우리 집"
            className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </label>
      </FormModal>

      <AlertModal
        open={pendingDeleteHouseholdId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteHouseholdId(null);
        }}
        title="거점 삭제"
        description={
          pendingDeleteHousehold
            ? `삭제하시겠습니까? 「${pendingDeleteHousehold.name}」과(와) 소속 방·재고 데이터가 함께 제거됩니다. 이 작업은 되돌릴 수 없습니다.`
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
