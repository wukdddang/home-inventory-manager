"use client";

import { useEffect, useMemo, useState } from "react";
import { useDashboard } from "../../_hooks/useDashboard";
import { DashboardHouseholdsSection } from "../DashboardHouseholds.section";
import { DashboardInventorySection } from "../DashboardInventory.section";
import { DashboardItemFormSection } from "../DashboardItemForm.section";
import { DashboardRoomsSection } from "../DashboardRooms.section";
import type { ViewMode } from "../ViewModeToggle.module";

export function DashboardPanel() {
  const { dataMode, households, loading, error, 거점을_삭제_한다 } =
    useDashboard();
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<ViewMode>("structure");
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  useEffect(() => {
    if (households.length === 0) {
      setSelectedHouseholdId(null);
      return;
    }
    setSelectedHouseholdId((prev) => {
      if (prev && households.some((h) => h.id === prev)) return prev;
      return households[0].id;
    });
  }, [households]);

  const selected = useMemo(
    () => households.find((h) => h.id === selectedHouseholdId) ?? null,
    [households, selectedHouseholdId],
  );

  const handleSelectHousehold = (id: string) => {
    setSelectedHouseholdId(id);
    setSelectedRoomId(null);
  };

  const handleAfterAddHousehold = (id: string) => {
    setSelectedHouseholdId(id);
    setSelectedRoomId(null);
  };

  const handleDeleteHousehold = (id: string) => {
    const next = households.filter((h) => h.id !== id);
    거점을_삭제_한다(id);
    if (selectedHouseholdId === id) {
      setSelectedHouseholdId(next[0]?.id ?? null);
      setSelectedRoomId(null);
    }
  };

  if (loading && households.length === 0) {
    return (
      <p className="text-sm text-zinc-500">거점 데이터를 불러오는 중…</p>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-rose-400" role="alert">
        {error}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {dataMode === "mock" ? (
        <div
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
          role="status"
        >
          <span className="font-medium">Mock 데이터</span>
          <span className="text-amber-200/90">
            {" "}
            — 인메모리 시드만 사용합니다. 실제 저장소·백엔드와 연결되지 않습니다.
          </span>
        </div>
      ) : null}
      <DashboardHouseholdsSection
        selectedHouseholdId={selectedHouseholdId}
        onSelectHousehold={handleSelectHousehold}
        onAfterAddHousehold={handleAfterAddHousehold}
        onDeleteHousehold={handleDeleteHousehold}
      />
      <DashboardRoomsSection
        selected={selected}
        selectedRoomId={selectedRoomId}
        onRoomSelect={setSelectedRoomId}
      />
      <DashboardInventorySection
        selected={selected}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedRoomId={selectedRoomId}
        onRoomSelect={setSelectedRoomId}
      />
      <DashboardItemFormSection selected={selected} />
    </div>
  );
}
