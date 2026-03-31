"use client";

import { useState, type ReactNode } from "react";
import {
  SettingsProvider,
  type SettingsDataPort,
  type SettingsContextType,
  type SettingsProviderProps,
} from "@/app/(current)/settings/_context/SettingsContext";
import { getAppSettings, setAppSettings } from "@/lib/local-store";

export type { SettingsContextType, SettingsProviderProps };
export { SettingsContext } from "@/app/(current)/settings/_context/SettingsContext";

/** mock용 localStorage 기반 서비스. API 호출 없이 로컬에서 모든 동작을 수행한다. */
const mockSettingsService: SettingsDataPort = {
  async loadSettings() {
    return getAppSettings();
  },
  async persistSettings(settings) {
    try {
      setAppSettings(settings);
    } catch (err) {
      console.error("설정 저장 오류:", err);
    }
  },
  // mock에서 만료 규칙은 persistSettings(전체 설정 저장)로 함께 처리되므로 no-op
  async saveExpirationRule() {},
  async deleteExpirationRule() {},
};

/**
 * mock 경로 전용 Provider.
 * localStorage 기반 서비스를 주입하며 API 호출을 하지 않는다.
 */
export function MockSettingsProvider({ children }: { children: ReactNode }) {
  const [port] = useState<SettingsDataPort>(() => mockSettingsService);

  return <SettingsProvider port={port}>{children}</SettingsProvider>;
}
