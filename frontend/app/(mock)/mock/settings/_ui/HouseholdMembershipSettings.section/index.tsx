"use client";

import { AlertModal } from "@/app/_ui/alert-modal";
import { FormModal } from "@/app/_ui/form-modal";
import { toast } from "@/hooks/use-toast";
import { getHouseholdKindLabel } from "@/lib/household-kind-defaults";
import { cn } from "@/lib/utils";
import type { GroupMember, Household, MemberRole, MockInvitation } from "@/types/domain";
import { useEffect, useMemo, useState } from "react";
import { useDashboard } from "../../../dashboard/_hooks/useDashboard";

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
  onSelectRole: (role: MemberRole) => void;
}) {
  const isLastSoleAdmin = member.role === "admin" && adminCount(list) <= 1;

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
                title={disabled ? "마지막 관리자의 역할은 변경할 수 없습니다" : undefined}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm",
                  disabled ? "cursor-not-allowed text-zinc-300" : "cursor-pointer text-zinc-200 hover:bg-zinc-800",
                  isCurrent && !disabled ? "bg-zinc-800/60" : "",
                )}
                onClick={() => {
                  if (disabled) return;
                  onSelectRole(role);
                  onToggle();
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
    멤버_역할을_변경_한다,
    멤버를_제거_한다,
    초대를_생성_한다,
    초대_목록을_불러온다,
    초대를_취소_한다,
    loading,
  } = useDashboard();

  const [pickedHouseholdId, setPickedHouseholdId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("editor");
  const [inviteExpiresInDays, setInviteExpiresInDays] = useState(7);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);

  const [pendingRemoveMemberId, setPendingRemoveMemberId] = useState<string | null>(null);
  const [rolePickerMemberId, setRolePickerMemberId] = useState<string | null>(null);

  const [invitations, setInvitations] = useState<MockInvitation[]>([]);
  const [invLinkRole, setInvLinkRole] = useState<MemberRole>("editor");
  const [invLinkGenerating, setInvLinkGenerating] = useState(false);
  const [invLinkUrl, setInvLinkUrl] = useState<string | null>(null);

  const selectedId = useMemo(() => {
    if (households.length === 0) return null;
    if (pickedHouseholdId && households.some((h) => h.id === pickedHouseholdId)) return pickedHouseholdId;
    return households[0]!.id;
  }, [households, pickedHouseholdId]);

  const selected: Household | null = useMemo(
    () => households.find((h) => h.id === selectedId) ?? null,
    [households, selectedId],
  );

  const members: GroupMember[] = selected?.members ?? [];

  const pendingRemoveMember = useMemo(
    () => members.find((m) => m.id === pendingRemoveMemberId) ?? null,
    [members, pendingRemoveMemberId],
  );

  // 초대 목록 로드
  useEffect(() => {
    if (!selectedId) return;
    setInvitations([]);
    void 초대_목록을_불러온다(selectedId).then(setInvitations).catch(() => {});
  }, [selectedId, 초대_목록을_불러온다]);

  // 역할 picker 외부 클릭 닫기
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

  const handleRoleChange = async (memberId: string, role: MemberRole) => {
    if (!selected) return;
    const target = members.find((m) => m.id === memberId);
    if (!target || target.role === role) return;
    if (target.role === "admin" && adminCount(members) <= 1 && role !== "admin") {
      toast({ title: "마지막 관리자의 역할은 변경할 수 없습니다", variant: "warning" });
      return;
    }
    try {
      await 멤버_역할을_변경_한다(selected.id, memberId, role);
      toast({ title: "멤버 역할을 변경했습니다", description: `${target.label ?? target.email}: ${ROLE_LABELS[role]}` });
    } catch {
      toast({ title: "역할 변경에 실패했습니다", variant: "warning" });
    }
  };

  const confirmRemove = async () => {
    if (!selected || !pendingRemoveMemberId) return;
    const target = members.find((m) => m.id === pendingRemoveMemberId);
    if (!target) return;
    if (target.role === "admin" && adminCount(members) <= 1) {
      toast({ title: "마지막 관리자는 제거할 수 없습니다", variant: "warning" });
      setPendingRemoveMemberId(null);
      return;
    }
    try {
      await 멤버를_제거_한다(selected.id, pendingRemoveMemberId);
      toast({ title: "멤버를 제거했습니다" });
    } catch {
      toast({ title: "멤버 제거에 실패했습니다", variant: "warning" });
    }
    setPendingRemoveMemberId(null);
  };

  const handleInviteSubmit = async () => {
    if (!selected) return;
    setInviteSubmitting(true);
    try {
      await 초대를_생성_한다(selected.id, {
        role: inviteRole,
        inviteeEmail: inviteEmail.trim() || undefined,
        expiresInDays: inviteExpiresInDays,
      });
      toast({ title: "초대장을 보냈습니다", description: inviteEmail.trim() ? `${inviteEmail.trim()} 에게 이메일 전송됨` : "링크 초대 생성됨" });
      const updated = await 초대_목록을_불러온다(selected.id);
      setInvitations(updated);
      setInviteEmail("");
      setInviteModalOpen(false);
    } catch (err) {
      toast({ title: "초대 생성에 실패했습니다", description: err instanceof Error ? err.message : undefined, variant: "warning" });
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleGenerateInviteLink = async () => {
    if (!selected) return;
    setInvLinkGenerating(true);
    setInvLinkUrl(null);
    try {
      const inv = await 초대를_생성_한다(selected.id, { role: invLinkRole, expiresInDays: 7 });
      const url = `${window.location.origin}/invite/${inv.token}`;
      setInvLinkUrl(url);
      await navigator.clipboard.writeText(url).catch(() => {});
      toast({ title: "초대 링크를 클립보드에 복사했습니다" });
      const updated = await 초대_목록을_불러온다(selected.id);
      setInvitations(updated);
    } catch {
      toast({ title: "링크 생성에 실패했습니다", variant: "warning" });
    } finally {
      setInvLinkGenerating(false);
    }
  };

  const handleRevokeInvitation = async (invId: string) => {
    if (!selected) return;
    try {
      await 초대를_취소_한다(selected.id, invId);
      setInvitations((prev) => prev.filter((i) => i.id !== invId));
      toast({ title: "초대를 취소했습니다" });
    } catch {
      toast({ title: "초대 취소에 실패했습니다", variant: "warning" });
    }
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
          등록된 거점이 없습니다. 대시보드에서 거점을 만든 뒤 멤버를 관리할 수 있습니다.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      <h2 className="text-base font-semibold text-white">거점 멤버십</h2>
      <p className="mt-1 text-sm text-zinc-300">
        거점마다 멤버와 역할을 관리합니다.
      </p>

      <div className="mt-4 space-y-1">
        <label className="text-xs text-zinc-300">거점 선택</label>
        <select
          value={selectedId ?? ""}
          onChange={(e) => setPickedHouseholdId(e.target.value || null)}
          className={inputClass}
        >
          {households.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name} · {getHouseholdKindLabel(h.kind, householdKindDefinitions)}
            </option>
          ))}
        </select>
      </div>

      {/* 멤버 목록 */}
      <div className="mt-5 flex items-center justify-between">
        <p className="text-xs text-zinc-300">멤버 {members.length}명</p>
        <button
          type="button"
          onClick={() => { setInviteEmail(""); setInviteModalOpen(true); }}
          className="shrink-0 cursor-pointer rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-teal-400"
        >
          초대장 보내기…
        </button>
      </div>

      <ul className="mt-3 divide-y divide-zinc-800 rounded-xl border border-zinc-800">
        {members.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-zinc-300">
            아직 멤버가 없습니다.
          </li>
        ) : (
          members.map((g) => (
            <li key={g.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium text-zinc-200">{g.email}</p>
                {g.label ? <p className="text-xs text-zinc-300">{g.label}</p> : null}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <MembershipRoleBadgePicker
                  member={g}
                  list={members}
                  isOpen={rolePickerMemberId === g.id}
                  onToggle={() => setRolePickerMemberId((id) => id === g.id ? null : g.id)}
                  onSelectRole={(role) => void handleRoleChange(g.id, role)}
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
        <p className="text-xs font-medium text-zinc-300">초대 링크 생성</p>
        <p className="mt-0.5 text-xs text-zinc-500">
          링크를 받은 사람이 가입 또는 로그인 후 거점에 참여할 수 있습니다.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <select
            value={invLinkRole}
            onChange={(e) => { setInvLinkRole(e.target.value as MemberRole); setInvLinkUrl(null); }}
            className={cn(inputClass, "max-w-40")}
          >
            <option value="viewer">조회자</option>
            <option value="editor">편집자</option>
            <option value="admin">관리자</option>
          </select>
          <button
            type="button"
            onClick={() => void handleGenerateInviteLink()}
            disabled={invLinkGenerating}
            className="shrink-0 cursor-pointer rounded-xl border border-teal-500/40 bg-teal-500/10 px-3 py-2 text-xs font-semibold text-teal-300 transition-colors hover:bg-teal-500/20 disabled:opacity-50"
          >
            {invLinkGenerating ? "생성 중…" : invLinkUrl ? "다시 생성" : "링크 생성"}
          </button>
        </div>
        {invLinkUrl && (
          <p className="mt-2 break-all rounded-lg bg-zinc-950 px-3 py-1.5 text-xs text-zinc-400">
            {invLinkUrl}
          </p>
        )}
      </div>

      {/* 보낸 초대 목록 */}
      {invitations.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-zinc-300">보낸 초대 ({invitations.length})</p>
          <ul className="mt-2 divide-y divide-zinc-800 rounded-xl border border-zinc-800">
            {invitations.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <span className="text-xs text-zinc-300">
                    {ROLE_LABELS[inv.role]} · {new Date(inv.createdAt).toLocaleDateString("ko-KR")}
                  </span>
                  <p className="text-xs text-zinc-500 font-mono">/invite/{inv.token}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleRevokeInvitation(inv.id)}
                  className="text-xs text-rose-400 hover:underline cursor-pointer"
                >
                  취소
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 초대장 발송 모달 (이메일 지정 초대) */}
      <FormModal
        open={inviteModalOpen}
        onOpenChange={(open) => { setInviteModalOpen(open); if (!open) setInviteEmail(""); }}
        title="초대장 보내기"
        description={selected ? `대상 거점: ${selected.name}` : ""}
        submitLabel={inviteSubmitting ? "전송 중…" : "초대 전송"}
        cancelLabel="취소"
        onSubmit={() => void handleInviteSubmit()}
        submitDisabled={inviteSubmitting}
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-zinc-300">이메일 (선택 — 비우면 누구나 수락 가능)</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className={inputClass}
              placeholder="member@example.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-300">역할</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as MemberRole)}
              className={inputClass}
            >
              <option value="viewer">조회자 — 조회만</option>
              <option value="editor">편집자 — 조회 · 추가 · 수정</option>
              <option value="admin">관리자 — 전체 + 멤버 관리</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-300">만료 (일)</label>
            <input
              type="number"
              min={1}
              max={30}
              value={inviteExpiresInDays}
              onChange={(e) => setInviteExpiresInDays(Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>
      </FormModal>

      <AlertModal
        open={pendingRemoveMemberId !== null}
        onOpenChange={(open) => { if (!open) setPendingRemoveMemberId(null); }}
        title="멤버 제거"
        description={pendingRemoveMember ? `「${pendingRemoveMember.email}」을(를) 이 거점에서 제거할까요?` : "제거할까요?"}
        confirmLabel="제거"
        cancelLabel="취소"
        variant="danger"
        onConfirm={() => void confirmRemove()}
      />
    </section>
  );
}
