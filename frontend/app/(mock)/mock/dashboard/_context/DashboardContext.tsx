"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  DashboardProvider,
  type DashboardContextType,
  type DashboardHouseholdsDataMode,
  type DashboardProviderProps,
} from "@/app/(current)/dashboard/_context/DashboardContext";
import {
  createDashboardMockHouseholdsService,
  MOCK_SEED_NOTIFICATIONS,
} from "./dashboard-mock.service";
import type { DashboardHouseholdsPort } from "./dashboard-households.port";
import { getNotifications, setNotifications } from "@/lib/local-store";

export type { DashboardContextType, DashboardHouseholdsDataMode, DashboardProviderProps };
export { DashboardContext } from "@/app/(current)/dashboard/_context/DashboardContext";
export type { DashboardHouseholdsPort };

/**
 * mock 경로 전용 Provider.
 * - mock 서비스를 주입한다 (인메모리 시드 데이터, localStorage 동기화).
 * - 알림 시드 데이터를 초기화한다.
 */
export function MockDashboardProvider({ children }: { children: ReactNode }) {
  // mock 서비스 인스턴스를 컴포넌트 수명 동안 유지 (초기화 함수로 한 번만 생성)
  const [port] = useState<DashboardHouseholdsPort>(
    () => createDashboardMockHouseholdsService(),
  );

  // mock 알림 시드: 저장된 알림이 없으면 시드 데이터를 채운다
  useEffect(() => {
    if (getNotifications().length === 0) {
      setNotifications(MOCK_SEED_NOTIFICATIONS);
    }
  }, []);

  return (
    <DashboardProvider port={port} dataMode="mock">
      {children}
    </DashboardProvider>
  );
}
