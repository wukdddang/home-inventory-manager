"use client";

import { HouseholdKindsManageModal } from "@/app/(mock)/mock/dashboard/_ui/HouseholdKindsManage.modal";
import { useState } from "react";
import { useDashboard } from "../../../dashboard/_hooks/useDashboard";

export function HouseholdKindsSettingsSection() {
  const { householdKindDefinitions } = useDashboard();
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      <h2 className="text-lg font-semibold text-white">거점 유형</h2>
      <p className="mt-1 text-sm text-zinc-500">
        대시보드에서 거점을 만들 때 고를 수 있는 유형(집·사무실 등)의 표시 이름을
        바꾸거나 항목을 추가·삭제합니다. 설정은 이 기기의 로컬 저장소에
        저장되며 대시보드와 동일하게 공유됩니다.
      </p>
      <p className="mt-3 text-sm text-zinc-400">
        현재{" "}
        <span className="font-medium text-zinc-200">
          {householdKindDefinitions.length}
        </span>
        개 유형
      </p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 cursor-pointer rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-teal-400"
      >
        유형 관리…
      </button>
      <HouseholdKindsManageModal open={open} onOpenChange={setOpen} />
    </section>
  );
}
