"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronRight } from "lucide-react";
import { useAppliances } from "../../_hooks/useAppliances";
import type { ApplianceStatusFilter } from "@/app/(current)/appliances/_context/AppliancesContext";

const STATUS_FILTER_OPTIONS: { value: ApplianceStatusFilter; label: string }[] = [
  { value: "active", label: "활성" },
  { value: "disposed", label: "폐기" },
  { value: "all", label: "전체" },
];

function 보증_상태_뱃지(warrantyExpiresOn?: string) {
  if (!warrantyExpiresOn) return null;
  const today = new Date().toISOString().slice(0, 10);
  const daysLeft = Math.ceil(
    (new Date(warrantyExpiresOn).getTime() - new Date(today).getTime()) /
      86400000,
  );
  if (daysLeft < 0) {
    return (
      <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-[11px] text-zinc-400">
        보증 만료
      </span>
    );
  }
  if (daysLeft <= 30) {
    return (
      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] text-amber-400">
        보증 {daysLeft}일 남음
      </span>
    );
  }
  return (
    <span className="rounded-full bg-teal-500/15 px-2 py-0.5 text-[11px] text-teal-400">
      보증 {warrantyExpiresOn}까지
    </span>
  );
}

function ApplianceRegisterForm({
  onClose,
  households,
}: {
  onClose: () => void;
  households: { id: string; name: string; rooms: { id: string; name: string }[] }[];
}) {
  const { 가전을_등록한다 } = useAppliances();
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [modelName, setModelName] = useState("");
  const [purchasedOn, setPurchasedOn] = useState("");
  const [warrantyExpiresOn, setWarrantyExpiresOn] = useState("");
  const [householdId, setHouseholdId] = useState(households[0]?.id ?? "");
  const [roomId, setRoomId] = useState("");

  const selectedHousehold = households.find((h) => h.id === householdId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    가전을_등록한다({
      householdId,
      name: name.trim(),
      brand: brand.trim() || undefined,
      modelName: modelName.trim() || undefined,
      purchasedOn: purchasedOn || undefined,
      warrantyExpiresOn: warrantyExpiresOn || undefined,
      roomId: roomId || undefined,
      status: "active",
    });
    onClose();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4"
      data-testid="appliance-register-form"
    >
      <h3 className="mb-3 text-sm font-semibold text-zinc-200">가전 등록</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400">이름 *</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 드럼세탁기"
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-teal-500"
            required
            data-testid="appliance-name-input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400">브랜드</span>
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="예: LG"
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-teal-500"
            data-testid="appliance-brand-input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400">모델명</span>
          <input
            type="text"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            placeholder="예: FX24KN"
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-teal-500"
            data-testid="appliance-model-input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400">구매일</span>
          <input
            type="date"
            value={purchasedOn}
            onChange={(e) => setPurchasedOn(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-teal-500"
            data-testid="appliance-purchased-input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400">보증 만료일</span>
          <input
            type="date"
            value={warrantyExpiresOn}
            onChange={(e) => setWarrantyExpiresOn(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-teal-500"
            data-testid="appliance-warranty-input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400">거점</span>
          <select
            value={householdId}
            onChange={(e) => {
              setHouseholdId(e.target.value);
              setRoomId("");
            }}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-teal-500"
          >
            {households.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400">설치 위치</span>
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-teal-500"
            data-testid="appliance-room-select"
          >
            <option value="">선택 안 함</option>
            {(selectedHousehold?.rooms ?? []).map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500"
          data-testid="appliance-register-submit"
        >
          등록
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
        >
          취소
        </button>
      </div>
    </form>
  );
}

export function ApplianceListSection() {
  const {
    appliances,
    households,
    schedules,
    statusFilter,
    상태_필터를_변경한다,
    가전을_선택한다,
    가전을_폐기한다,
  } = useAppliances();
  const [showForm, setShowForm] = useState(false);

  const filteredAppliances = appliances.filter((a) => {
    if (statusFilter === "all") return true;
    return a.status === statusFilter;
  });

  const roomNameMap = new Map<string, string>();
  households.forEach((h) =>
    h.rooms.forEach((r) => roomNameMap.set(r.id, r.name)),
  );

  return (
    <div className="flex flex-col gap-4">
      {/* 툴바 */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-zinc-700 p-0.5" role="tablist" data-testid="status-filter">
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              role="tab"
              aria-selected={statusFilter === opt.value}
              onClick={() => 상태_필터를_변경한다(opt.value)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === opt.value
                  ? "bg-teal-500/15 text-teal-300"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              data-testid={`filter-${opt.value}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setShowForm((p) => !p)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-500"
          data-testid="add-appliance-btn"
        >
          <Plus className="size-3.5" />
          가전 등록
        </button>
      </div>

      {/* 등록 폼 */}
      {showForm && (
        <ApplianceRegisterForm
          onClose={() => setShowForm(false)}
          households={households}
        />
      )}

      {/* 목록 */}
      {filteredAppliances.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-500" data-testid="empty-list">
          <p className="text-sm">
            {statusFilter === "disposed"
              ? "폐기된 가전이 없습니다."
              : "등록된 가전이 없습니다."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="appliance-list">
          {filteredAppliances.map((appliance) => {
            const roomName = appliance.roomId
              ? roomNameMap.get(appliance.roomId)
              : undefined;
            const schCount = schedules.filter(
              (s) => s.applianceId === appliance.id && s.isActive,
            ).length;

            return (
              <div
                key={appliance.id}
                className="group relative flex cursor-pointer flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900/90"
                onClick={() => 가전을_선택한다(appliance)}
                data-testid={`appliance-card-${appliance.id}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-zinc-100">
                      {appliance.name}
                    </h3>
                    {(appliance.brand || appliance.modelName) && (
                      <p className="mt-0.5 truncate text-xs text-zinc-400">
                        {[appliance.brand, appliance.modelName]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-zinc-600 transition-colors group-hover:text-zinc-400" />
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {appliance.status === "disposed" ? (
                    <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] text-rose-400" data-testid="disposed-badge">
                      폐기 ({appliance.disposedOn})
                    </span>
                  ) : (
                    보증_상태_뱃지(appliance.warrantyExpiresOn)
                  )}
                  {roomName && (
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400">
                      {roomName}
                    </span>
                  )}
                  {schCount > 0 && (
                    <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[11px] text-blue-400">
                      스케줄 {schCount}건
                    </span>
                  )}
                </div>

                {/* 폐기 버튼 (활성 가전만) */}
                {appliance.status === "active" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      가전을_폐기한다(
                        appliance.id,
                        new Date().toISOString().slice(0, 10),
                      );
                    }}
                    className="absolute top-3 right-3 hidden size-7 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-rose-400 group-hover:flex"
                    title="폐기 처리"
                    data-testid={`dispose-btn-${appliance.id}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
