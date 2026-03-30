"use client";

import { DashboardMobileSkeleton } from "@/app/_ui/mobile/MobileSkeleton.component";
import { useSelectedHouseholdShell } from "@/app/(current)/_ui/selected-household-shell-bridge";
import { MOBILE_HOUSEHOLD_SELECT_EVENT } from "@/app/(current)/_ui/AppShell.component";
import { useEffect, useMemo, useState } from "react";
import { useDashboard } from "../../_hooks/useDashboard";
import { InventoryCardList } from "./InventoryCardList.section";
import { ExpiryAlerts } from "./ExpiryAlerts.section";
import { ItemActionSheet } from "./ItemActionSheet.component";
import { UseItemSheet } from "./UseItemSheet.component";
import { WasteItemSheet } from "./WasteItemSheet.component";
import { RestockItemSheet } from "./RestockItemSheet.component";
import { ShoppingListFab } from "./ShoppingListFab.component";
import type { InventoryRow } from "@/types/domain";

export function DashboardMobilePanel() {
  const { households, loading, error } = useDashboard();
  const { setHousehold: setShellHousehold } = useSelectedHouseholdShell();
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(
    null,
  );

  // 바텀시트 상태
  const [actionItem, setActionItem] = useState<InventoryRow | null>(null);
  const [useItem, setUseItem] = useState<InventoryRow | null>(null);
  const [wasteItem, setWasteItem] = useState<InventoryRow | null>(null);
  const [restockItem, setRestockItem] = useState<InventoryRow | null>(null);

  const viewingHouseholdId = useMemo(() => {
    if (households.length === 0) return null;
    if (
      selectedHouseholdId != null &&
      households.some((h) => h.id === selectedHouseholdId)
    ) {
      return selectedHouseholdId;
    }
    return households[0]?.id ?? null;
  }, [households, selectedHouseholdId]);

  const selected = useMemo(
    () => households.find((h) => h.id === viewingHouseholdId) ?? null,
    [households, viewingHouseholdId],
  );

  // 쉘 브릿지에 선택된 가구 전달
  useEffect(() => {
    setShellHousehold(selected);
    return () => setShellHousehold(null);
  }, [selected, setShellHousehold]);

  // MobileHeader 가구 전환 이벤트 수신
  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      setSelectedHouseholdId(id);
    };
    window.addEventListener(MOBILE_HOUSEHOLD_SELECT_EVENT, handler);
    return () =>
      window.removeEventListener(MOBILE_HOUSEHOLD_SELECT_EVENT, handler);
  }, []);

  if (loading && households.length === 0) {
    return <DashboardMobileSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center px-4">
        <p className="text-sm text-rose-400">{error}</p>
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-zinc-400">등록된 거점이 없습니다.</p>
        <p className="text-xs text-zinc-500">
          데스크탑에서 거점을 추가해 주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-4">
      <ExpiryAlerts
        household={selected}
        onUse={(item) => setActionItem(item)}
        onWaste={(item) => setActionItem(item)}
      />
      <InventoryCardList
        household={selected}
        onItemTap={(item) => setActionItem(item)}
      />
      <ShoppingListFab household={selected} />
      <ItemActionSheet
        item={actionItem}
        household={selected}
        onClose={() => setActionItem(null)}
        onUse={(item) => setUseItem(item)}
        onWaste={(item) => setWasteItem(item)}
        onRestock={(item) => setRestockItem(item)}
      />
      <UseItemSheet
        item={useItem}
        householdId={selected.id}
        onClose={() => setUseItem(null)}
      />
      <WasteItemSheet
        item={wasteItem}
        householdId={selected.id}
        onClose={() => setWasteItem(null)}
      />
      <RestockItemSheet
        item={restockItem}
        householdId={selected.id}
        onClose={() => setRestockItem(null)}
      />
    </div>
  );
}
