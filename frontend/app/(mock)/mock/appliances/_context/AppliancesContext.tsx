"use client";

/**
 * mock 경로 전용 서비스 주입 래퍼.
 *
 * Provider 본체·Port 타입·CurrentAppliancesProvider·API 서비스는
 * `(current)/appliances/_context/AppliancesContext` 에 있다.
 */

import { useState, type ReactNode } from "react";
import {
  AppliancesProvider,
  type AppliancesDataPort,
  type AppliancesContextType,
  type AppliancesDataMode,
  type AppliancesProviderProps,
} from "@/app/(current)/appliances/_context/AppliancesContext";
import { MOCK_SEED_HOUSEHOLDS } from "../../dashboard/_context/dashboard-mock.service";
import {
  getMockAppliancesSession,
  subscribeMockAppliancesSession,
  updateMockAppliancesSession,
  getMockSchedulesSession,
  subscribeMockSchedulesSession,
  updateMockSchedulesSession,
  getMockLogsSession,
  subscribeMockLogsSession,
  updateMockLogsSession,
} from "./appliances-mock.service";
import type {
  Appliance,
  MaintenanceLog,
  MaintenanceSchedule,
} from "@/types/domain";

export type { AppliancesContextType, AppliancesDataMode, AppliancesProviderProps };
export { AppliancesContext } from "@/app/(current)/appliances/_context/AppliancesContext";

export function MockAppliancesProvider({ children }: { children: ReactNode }) {
  const [port] = useState<AppliancesDataPort>(() => ({
    getInitialHouseholds: (fromStore) =>
      fromStore.length > 0 ? fromStore : structuredClone(MOCK_SEED_HOUSEHOLDS),

    loadAppliances: async () => getMockAppliancesSession(),
    loadSchedules: async () => getMockSchedulesSession(),
    loadLogs: async () => getMockLogsSession(),

    addAppliance: async (draft, onSuccess) => {
      const row: Appliance = {
        ...draft,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString().slice(0, 10),
      };
      updateMockAppliancesSession((prev) => [...prev, row]);
      onSuccess();
    },

    updateAppliance: async (appliance, onSuccess) => {
      updateMockAppliancesSession((prev) =>
        prev.map((a) => (a.id === appliance.id ? appliance : a)),
      );
      onSuccess();
    },

    disposeAppliance: async (applianceId, disposedOn, onSuccess) => {
      updateMockAppliancesSession((prev) =>
        prev.map((a) =>
          a.id === applianceId
            ? { ...a, status: "disposed" as const, disposedOn }
            : a,
        ),
      );
      onSuccess();
    },

    addSchedule: async (draft, onSuccess) => {
      const row: MaintenanceSchedule = { ...draft, id: crypto.randomUUID() };
      updateMockSchedulesSession((prev) => [...prev, row]);
      onSuccess();
    },

    updateSchedule: async (schedule, onSuccess) => {
      updateMockSchedulesSession((prev) =>
        prev.map((s) => (s.id === schedule.id ? schedule : s)),
      );
      onSuccess();
    },

    addLog: async (draft, onSuccess) => {
      const row: MaintenanceLog = {
        ...draft,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString().slice(0, 10),
      };
      updateMockLogsSession((prev) => [...prev, row]);
      onSuccess();
    },

    subscribeAppliances: (set) =>
      subscribeMockAppliancesSession(() => set(getMockAppliancesSession())),
    subscribeSchedules: (set) =>
      subscribeMockSchedulesSession(() => set(getMockSchedulesSession())),
    subscribeLogs: (set) =>
      subscribeMockLogsSession(() => set(getMockLogsSession())),
  }));

  return (
    <AppliancesProvider port={port} dataMode="mock">
      {children}
    </AppliancesProvider>
  );
}
