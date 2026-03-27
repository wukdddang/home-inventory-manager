"use client";

import { AlertModal } from "@/app/_ui/alert-modal";
import { FormModal } from "@/app/_ui/form-modal";
import { toast } from "@/hooks/use-toast";
import { getHouseholdKindLabel } from "@/lib/household-kind-defaults";
import { cn } from "@/lib/utils";
import type { GroupMember, Household, MemberRole } from "@/types/domain";
import { useEffect, useMemo, useState } from "react";
import { useDashboard } from "../../../dashboard/_hooks/useDashboard";

function newMemberId() {
  return crypto.randomUUID();
}

function membersOf(h: Household): GroupMember[] {
  return h.members ?? [];
}

function adminCount(list: GroupMember[]) {
  return list.filter((m) => m.role === "admin").length;
}

const ROLE_LABELS: Record<MemberRole, string> = {
  admin: "관리자",
  editor: "편집자",
  viewer: "조회자",
};

const ROLE_BADGE_STYLES: Record<MemberRole, string> = {
  admin: "bg-amber-500/15 text-amber-100 ring-amber-500/45 hover:bg-amber-500/25",
  editor: "bg-blue-500/15 text-blue-100 ring-blue-500/45 hover:bg-blue-500/25",
  viewer: "bg-zinc-700/55 text-zinc-200 ring-zinc-600 hover:bg-zinc-600/70",
};

const ROLE_DOT_ACTIVE: Record<MemberRole, string> = {
  admin: "bg-amber-400",
  editor: "bg-blue-400",
  viewer: "bg-teal-400",
};

const inputClass =
  "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30";

const ALL_ROLES: MemberRole[] = ["admin", "editor", "viewer"];

function MembershipRoleBadgePicker({
  member,
  list,
  isOpen,
  onToggle,
  onSelectRole,
}: {
  member: GroupMember;
  list: GroupMember[];
  isOpen: boolean;
  onToggle: () => void;
  onSelectRole: (role: MemberRole) => boolean;
}) {
  const isLastSoleAdmin =
    member.role === "admin" && adminCount(list) <= 1;

  return (
    <div
      data-membership-role-picker
      data-member-id={member.id}
      className="relative flex shrink-0 flex-col items-end gap-0"
    >
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "cursor-pointer rounded-full px-2.5 py-1 text-xs font-semibold ring-1 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50",
          ROLE_BADGE_STYLES[member.role],
        )}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={`역할: ${ROLE_LABELS[member.role]}. 클릭하여 변경`}
      >
        {ROLE_LABELS[member.role]}
      </button>
      {isOpen ? (
        <div
          className="absolute top-[calc(100%+0.35rem)] right-0 z-40 w-48 rounded-xl border border-zinc-700 bg-zinc-900 py-1.5 shadow-xl ring-1 ring-black/35"
          role="dialog"
          aria-label="역할 변경"
        >
          <p className="px-3 pb-1 text-xs font-medium tracking-wide text-zinc-300 uppercase">
            역할 선택
          </p>
          {ALL_ROLES.map((role) => {
            const isCurrent = member.role === role;
            const disabled = isLastSoleAdmin && role !== "admin";
            return (
              <button
                key={role}
                type="button"
                disabled={disabled}
                title={
                  disabled
                    ? "마지막 관리자의 역할은 변경할 수 없습니다"
                    : undefined
                }
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm",
                  disabled
                    ? "cursor-not-allowed text-zinc-300"
                    : "cursor-pointer text-zinc-200 hover:bg-zinc-800",
                  isCurrent && !disabled ? "bg-zinc-800/60" : "",
                )}
                onClick={() => {
                  if (disabled) return;
                  if (onSelectRole(role)) onToggle();
                }}
              >
                <span
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    isCurrent ? ROLE_DOT_ACTIVE[role] : "bg-zinc-600",
                  )}
                />
                {ROLE_LABELS[role]}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function HouseholdMembershipSettingsSection() {
  const {
    households,
    householdKindDefinitions,
    거점을_갱신_한다,
    loading,
  } = useDashboard();
  const [pickedHouseholdId, setPickedHouseholdId] = useState<string | null>(
    null,
  );
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLabel, setInviteLabel] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("editor");
  const [pendingRemoveMemberId, setPendingRemoveMemberId] = useState<
    string | null
  >(null);
  const [rolePickerMemberId, setRolePickerMemberId] = useState<string | null>(
    null,
  );
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteLinkRole, setInviteLinkRole] = useState<MemberRole>("editor");
  const [inviteLinkUrl, setInviteLinkUrl] = useState<string | null>(null);

  const selectedId = useMemo(() => {
    if (households.length === 0) return null;
    if (
      pickedHouseholdId &&
      households.some((h) => h.id === pickedHouseholdId)
    ) {
      return pickedHouseholdId;
    }
    return households[0]!.id;
  }, [households, pickedHouseholdId]);

  const selected = useMemo(
    () => households.find((h) => h.id === selectedId) ?? null,
    [households, selectedId],
  );

  const pendingRemoveMember = useMemo(() => {
    if (!pendingRemoveMemberId || !selected) return null;
    return (
      membersOf(selected).find((m) => m.id === pendingRemoveMemberId) ?? null
    );
  }, [pendingRemoveMemberId, selected]);

  const resetInviteFields = () => {
    setInviteEmail("");
    setInviteLabel("");
    setInviteRole("editor");
  };

  const handleInviteModalSubmit = () => {
    if (!selected) return;
    const email = inviteEmail.trim().toLowerCase();
    if (!email) {
      toast({ title: "이메일을 입력하세요", variant: "warning" });
      return;
    }
    const list = membersOf(selected);
    if (list.some((m) => m.email.toLowerCase() === email)) {
      toast({
        title: "이미 초대된 이메일입니다",
        variant: "warning",
      });
      return;
    }
    const m: GroupMember = {
      id: newMemberId(),
      email: inviteEmail.trim(),
      role: inviteRole,
      label: inviteLabel.trim() || undefined,
    };
    const next = [...list, m];
    if (adminCount(next) < 1) {
      toast({
        title: "관리자가 한 명 이상 필요합니다",
        variant: "warning",
      });
      return;
    }
    거점을_갱신_한다(selected.id, (h) => ({
      ...h,
      members: next,
    }));
    resetInviteFields();
    setInviteModalOpen(false);
    toast({
      title: "멤버를 추가했습니다",
      description: `${selected.name} · (로컬 데모)`,
    });
  };

  const handleRoleChange = (
    memberId: string,
    role: MemberRole,
  ): boolean => {
    if (!selected) return false;
    const list = membersOf(selected);
    const target = list.find((m) => m.id === memberId);
    if (!target || target.role === role) return false;
    if (target.role === "admin" && adminCount(list) <= 1 && role !== "admin") {
      toast({
        title: "마지막 관리자의 역할은 변경할 수 없습니다",
        variant: "warning",
      });
      return false;
    }
    const next = list.map((m) =>
      m.id === memberId ? { ...m, role } : m,
    );
    거점을_갱신_한다(selected.id, (h) => ({ ...h, members: next }));
    return true;
  };

  useEffect(() => {
    if (!rolePickerMemberId) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = document.querySelector(
        `[data-membership-role-picker][data-member-id="${rolePickerMemberId}"]`,
      );
      if (el && e.target instanceof Node && el.contains(e.target)) return;
      setRolePickerMemberId(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setRolePickerMemberId(null);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [rolePickerMemberId]);

  const confirmRemove = () => {
    if (!selected || !pendingRemoveMemberId) return;
    const list = membersOf(selected);
    const target = list.find((m) => m.id === pendingRemoveMemberId);
    if (!target) return;
    if (target.role === "admin" && adminCount(list) <= 1) {
      toast({
        title: "마지막 관리자는 제거할 수 없습니다",
        variant: "warning",
      });
      setPendingRemoveMemberId(null);
      return;
    }
    거점을_갱신_한다(selected.id, (h) => ({
      ...h,
      members: list.filter((m) => m.id !== pendingRemoveMemberId),
    }));
    setPendingRemoveMemberId(null);
    toast({ title: "멤버를 제거했습니다" });
  };

  if (loading && households.length === 0) {
    return (
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <h2 className="text-base font-semibold text-white">거점 멤버십</h2>
        <p className="mt-2 text-sm text-zinc-300">거점 목록을 불러오는 중…</p>
      </section>
    );
  }

  if (households.length === 0) {
    return (
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <h2 className="text-base font-semibold text-white">거점 멤버십</h2>
        <p className="mt-2 text-sm text-zinc-300">
          등록된 거점이 없습니다. 대시보드에서 거점을 만든 뒤 멤버를 관리할 수
          있습니다.
        </p>
      </section>
    );
  }

  const members = selected ? membersOf(selected) : [];

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      <h2 className="text-base font-semibold text-white">거점 멤버십</h2>
      <p className="mt-1 text-sm text-zinc-300">
        거점(가족·공유 그룹)마다 멤버·역할을 둡니다. 초대 메일·권한 검증은
        백엔드 연동 후 연결하세요.
      </p>

      <div className="mt-4 space-y-1">
        <label className="text-xs text-zinc-300">거점 선택</label>
        <select
          value={selectedId ?? ""}
          onChange={(e) =>
            setPickedHouseholdId(e.target.value || null)
          }
          className={inputClass}
        >
          {households.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name} ·{" "}
              {getHouseholdKindLabel(h.kind, householdKindDefinitions)}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-zinc-300">
          멤버 초대·역할 지정은 모달에서 진행합니다.
        </p>
        <button
          type="button"
          onClick={() => {
            resetInviteFields();
            setInviteModalOpen(true);
          }}
          className="shrink-0 cursor-pointer rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-teal-400"
        >
          멤버 추가…
        </button>
      </div>

      <FormModal
        open={inviteModalOpen}
        onOpenChange={(open) => {
          setInviteModalOpen(open);
          if (!open) resetInviteFields();
        }}
        title="멤버 추가"
        description={
          selected
            ? `대상 거점: ${selected.name} (${getHouseholdKindLabel(selected.kind, householdKindDefinitions)}) · 데모에서는 로컬에만 반영됩니다.`
            : ""
        }
        submitLabel="추가"
        cancelLabel="취소"
        onSubmit={handleInviteModalSubmit}
        submitDisabled={!inviteEmail.trim()}
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-zinc-300">이메일</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className={inputClass}
              placeholder="member@example.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-300">표시 이름 (선택)</label>
            <input
              value={inviteLabel}
              onChange={(e) => setInviteLabel(e.target.value)}
              className={inputClass}
              placeholder="엄마, 동료…"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-300">역할</label>
            <select
              value={inviteRole}
              onChange={(e) =>
                setInviteRole(e.target.value as MemberRole)
              }
              className={inputClass}
            >
              <option value="viewer">조회자 — 조회만</option>
              <option value="editor">편집자 — 조회 · 추가 · 수정</option>
              <option value="admin">관리자 — 전체 + 멤버 관리</option>
            </select>
          </div>
        </div>
      </FormModal>

      <ul className="mt-4 divide-y divide-zinc-800 rounded-xl border border-zinc-800">
        {members.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-zinc-300">
            아직 멤버가 없습니다. 첫 멤버는{" "}
            <span className="text-zinc-300">관리자</span>로 두는 것을
            권장합니다.
          </li>
        ) : (
          members.map((g) => (
            <li
              key={g.id}
              className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium text-zinc-200">{g.email}</p>
                {g.label ? (
                  <p className="text-xs text-zinc-300">{g.label}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <MembershipRoleBadgePicker
                  member={g}
                  list={members}
                  isOpen={rolePickerMemberId === g.id}
                  onToggle={() =>
                    setRolePickerMemberId((id) =>
                      id === g.id ? null : g.id,
                    )
                  }
                  onSelectRole={(role) => handleRoleChange(g.id, role)}
                />
                <button
                  type="button"
                  onClick={() => setPendingRemoveMemberId(g.id)}
                  className="cursor-pointer text-xs text-rose-400 hover:underline"
                >
                  제거
                </button>
              </div>
            </li>
          ))
        )}
      </ul>

      {/* 초대 링크 */}
      <div className="mt-4 rounded-xl border border-zinc-800 p-4">
        <p className="text-xs font-medium text-zinc-300">초대 링크 생성 (모의)</p>
        <p className="mt-0.5 text-xs text-zinc-500">
          링크를 받은 사람이 거점에 참여할 수 있습니다. 백엔드 연동 전 데모입니다.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <select
            value={inviteLinkRole}
            onChange={(e) => {
              setInviteLinkRole(e.target.value as MemberRole);
              setInviteLinkUrl(null);
            }}
            className={cn(inputClass, "max-w-40")}
          >
            <option value="viewer">조회자</option>
            <option value="editor">편집자</option>
            <option value="admin">관리자</option>
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
            className="shrink-0 cursor-pointer rounded-xl border border-teal-500/40 bg-teal-500/10 px-3 py-2 text-xs font-semibold text-teal-300 transition-colors hover:bg-teal-500/20"
          >
            {inviteLinkUrl ? "다시 생성" : "링크 생성"}
          </button>
        </div>
        {inviteLinkUrl && (
          <p className="mt-2 break-all rounded-lg bg-zinc-950 px-3 py-1.5 text-xs text-zinc-400">
            {inviteLinkUrl}
          </p>
        )}
      </div>

      <AlertModal
        open={pendingRemoveMemberId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemoveMemberId(null);
        }}
        title="멤버 제거"
        description={
          pendingRemoveMember
            ? `「${pendingRemoveMember.email}」을(를) 이 거점에서 제거할까요?`
            : "제거할까요?"
        }
        confirmLabel="제거"
        cancelLabel="취소"
        variant="danger"
        onConfirm={confirmRemove}
      />
    </section>
  );
}
