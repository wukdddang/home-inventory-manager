"use client";

import { FormEvent, useState } from "react";
import { useSettings } from "../../_hooks/useSettings";
import type { GroupMember } from "@/types/domain";

function newMemberId() {
  return crypto.randomUUID();
}

export function GroupSettingsSection() {
  const { settings, 그룹_멤버를_추가_한다, 그룹_멤버를_제거_한다 } =
    useSettings();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLabel, setInviteLabel] = useState("");

  if (!settings) return null;

  const handleAddMember = (e: FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim();
    if (!email) return;
    const m: GroupMember = {
      id: newMemberId(),
      email,
      role: "member",
      label: inviteLabel.trim() || undefined,
    };
    그룹_멤버를_추가_한다(m);
    setInviteEmail("");
    setInviteLabel("");
  };

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      <h2 className="text-base font-semibold text-white">
        가족 / 그룹 (Household 공유)
      </h2>
      <p className="mt-1 text-sm text-zinc-500">
        초대할 이메일을 추가합니다. 실제 초대 메일은 백엔드 구현 후 연결하세요.
      </p>
      <form
        onSubmit={handleAddMember}
        className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <div className="flex-1 space-y-1">
          <label className="text-xs text-zinc-400">이메일</label>
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500"
            placeholder="member@family.com"
          />
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-xs text-zinc-400">표시 이름 (선택)</label>
          <input
            value={inviteLabel}
            onChange={(e) => setInviteLabel(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500"
            placeholder="엄마, 룸메이트…"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-teal-400"
        >
          멤버 추가
        </button>
      </form>
      <ul className="mt-4 divide-y divide-zinc-800 rounded-xl border border-zinc-800">
        {settings.groups.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm text-zinc-500">
            등록된 그룹 멤버가 없습니다.
          </li>
        ) : (
          settings.groups.map((g) => (
            <li
              key={g.id}
              className="flex items-center justify-between gap-2 px-4 py-3"
            >
              <div>
                <p className="font-medium text-zinc-200">{g.email}</p>
                {g.label ? (
                  <p className="text-xs text-zinc-500">{g.label}</p>
                ) : null}
                <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                  {g.role}
                </p>
              </div>
              <button
                type="button"
                onClick={() => 그룹_멤버를_제거_한다(g.id)}
                className="text-xs text-rose-400 hover:underline"
              >
                제거
              </button>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
