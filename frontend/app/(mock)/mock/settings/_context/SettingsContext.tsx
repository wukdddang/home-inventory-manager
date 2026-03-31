"use client";

/**
 * mock 경로 전용 서비스 주입 래퍼.
 *
 * Provider 본체·Port 타입·CurrentSettingsProvider·API 서비스는
 * `(current)/settings/_context/SettingsContext` 에 있다.
 *
 * 이 파일은 localStorage 기반 mock 서비스를 생성해 베이스 Provider 에 주입하는
 * MockSettingsProvider 만 담당한다.
 * API 호출은 일절 없으며, 만료 규칙의 개별 저장·삭제는
 * persistSettings(전체 설정 저장) 로 함께 처리된다.
 */

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
