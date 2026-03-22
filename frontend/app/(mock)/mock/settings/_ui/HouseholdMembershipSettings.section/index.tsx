"use client";

import { AlertModal } from "@/app/_ui/alert-modal";
import { toast } from "@/hooks/use-toast";
import { getHouseholdKindLabel } from "@/lib/household-kind-defaults";
import { cn } from "@/lib/utils";
import type { GroupMember, Household } from "@/types/domain";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useDashboard } from "../../../dashboard/_hooks/useDashboard";

function newMemberId() {
  return crypto.randomUUID();
}

function membersOf(h: Household): GroupMember[] {
  return h.members ?? [];
}

function ownerCount(list: GroupMember[]) {
  return list.filter((m) => m.role === "owner").length;
}

const inputClass =
  "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30";

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
  onSelectRole: (role: "owner" | "member") => boolean;
}) {
  const isLastSoleOwner =
    member.role === "owner" && ownerCount(list) <= 1;

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
          member.role === "owner"
            ? "bg-amber-500/15 text-amber-100 ring-amber-500/45 hover:bg-amber-500/25"
            : "bg-zinc-700/55 text-zinc-200 ring-zinc-600 hover:bg-zinc-600/70",
        )}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={`역할: ${member.role === "owner" ? "소유자" : "멤버"}. 클릭하여 변경`}
      >
        {member.role === "owner" ? "소유자" : "멤버"}
      </button>
      {isOpen ? (
        <div
          className="absolute top-[calc(100%+0.35rem)] right-0 z-40 w-48 rounded-xl border border-zinc-700 bg-zinc-900 py-1.5 shadow-xl ring-1 ring-black/35"
          role="dialog"
          aria-label="역할 변경"
        >
          <p className="px-3 pb-1 text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
            역할 선택
          </p>
          <button
            type="button"
            className={cn(
              "flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm",
              member.role === "owner"
                ? "bg-amber-500/10 text-amber-100"
                : "text-zinc-200 hover:bg-zinc-800",
            )}
            onClick={() => {
              if (onSelectRole("owner")) onToggle();
            }}
          >
            <span
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                member.role === "owner" ? "bg-amber-400" : "bg-zinc-600",
              )}
            />
            소유자
          </button>
          <button
            type="button"
            disabled={isLastSoleOwner}
            title={
              isLastSoleOwner
                ? "마지막 소유자는 멤버로 바꿀 수 없습니다"
                : undefined
            }
            className={cn(
              "flex w-full items-center gap-2 px-3 py-2 text-left text-sm",
              isLastSoleOwner
                ? "cursor-not-allowed text-zinc-600"
                : "cursor-pointer text-zinc-200 hover:bg-zinc-800",
              member.role === "member" && !isLastSoleOwner
                ? "bg-zinc-800/60"
                : "",
            )}
            onClick={() => {
              if (isLastSoleOwner) return;
              if (onSelectRole("member")) onToggle();
            }}
          >
            <span
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                member.role === "member" ? "bg-teal-400" : "bg-zinc-600",
              )}
            />
            멤버
          </button>
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
  const [inviteRole, setInviteRole] = useState<"owner" | "member">("member");
  const [pendingRemoveMemberId, setPendingRemoveMemberId] = useState<
    string | null
  >(null);
  const [rolePickerMemberId, setRolePickerMemberId] = useState<string | null>(
    null,
  );

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

  const handleAddMember = (e: FormEvent) => {
    e.preventDefault();
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
    if (ownerCount(next) < 1) {
      toast({
        title: "소유자가 한 명 이상 필요합니다",
        variant: "warning",
      });
      return;
    }
    거점을_갱신_한다(selected.id, (h) => ({
      ...h,
      members: next,
    }));
    setInviteEmail("");
    setInviteLabel("");
    setInviteRole("member");
    toast({
      title: "멤버를 추가했습니다",
      description: `${selected.name} · (로컬 데모)`,
    });
  };

  const handleRoleChange = (
    memberId: string,
    role: "owner" | "member",
  ): boolean => {
    if (!selected) return false;
    const list = membersOf(selected);
    const target = list.find((m) => m.id === memberId);
    if (!target || target.role === role) return false;
    if (target.role === "owner" && ownerCount(list) <= 1 && role === "member") {
      toast({
        title: "마지막 소유자는 멤버로 바꿀 수 없습니다",
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
    if (target.role === "owner" && ownerCount(list) <= 1) {
      toast({
        title: "마지막 소유자는 제거할 수 없습니다",
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
        <p className="mt-2 text-sm text-zinc-500">거점 목록을 불러오는 중…</p>
      </section>
    );
  }

  if (households.length === 0) {
    return (
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <h2 className="text-base font-semibold text-white">거점 멤버십</h2>
        <p className="mt-2 text-sm text-zinc-500">
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
      <p className="mt-1 text-sm text-zinc-500">
        거점(가족·공유 그룹)마다 멤버·역할을 둡니다. 초대 메일·권한 검증은
        백엔드 연동 후 연결하세요.
      </p>

      <div className="mt-4 space-y-1">
        <label className="text-xs text-zinc-400">거점 선택</label>
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

      <form
        onSubmit={handleAddMember}
        className="mt-5 flex flex-col gap-3 rounded-xl border border-zinc-800/90 bg-zinc-950/40 p-4"
      >
        <p className="text-xs font-medium text-zinc-400">멤버 초대 (데모)</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-1">
            <label className="text-xs text-zinc-500">이메일</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className={inputClass}
              placeholder="member@example.com"
            />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <label className="text-xs text-zinc-500">표시 이름 (선택)</label>
            <input
              value={inviteLabel}
              onChange={(e) => setInviteLabel(e.target.value)}
              className={inputClass}
              placeholder="엄마, 동료…"
            />
          </div>
          <div className="w-full space-y-1 sm:w-36">
            <label className="text-xs text-zinc-500">역할</label>
            <select
              value={inviteRole}
              onChange={(e) =>
                setInviteRole(e.target.value as "owner" | "member")
              }
              className={inputClass}
            >
              <option value="member">멤버</option>
              <option value="owner">소유자</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full shrink-0 cursor-pointer rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-teal-400 sm:w-auto"
          >
            추가
          </button>
        </div>
      </form>

      <ul className="mt-4 divide-y divide-zinc-800 rounded-xl border border-zinc-800">
        {members.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-zinc-500">
            아직 멤버가 없습니다. 첫 멤버는{" "}
            <span className="text-zinc-400">소유자</span>로 두는 것을
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
                  <p className="text-xs text-zinc-500">{g.label}</p>
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
