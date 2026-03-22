"use client";

import {
  DashboardProvider,
  type DashboardHouseholdsDataMode,
} from "./_context/DashboardContext";
import { DashboardPanel } from "./_ui/DashboardPage.panel";

export type DashboardScreenProps = {
  dataMode: DashboardHouseholdsDataMode;
};

export function DashboardScreen({ dataMode }: DashboardScreenProps) {
  return (
    <DashboardProvider dataMode={dataMode}>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <DashboardPanel />
      </div>
    </DashboardProvider>
  );
}
