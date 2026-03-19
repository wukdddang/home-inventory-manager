"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getAppSettings, setAppSettings as persistSettings } from "@/lib/local-store";
import type { AppSettings, GroupMember } from "@/types/domain";

export type SettingsContextType = {
  settings: AppSettings | null;
  loading: boolean;
  error: string | null;
  /** 로컬 스토리지에서 설정을 읽는다 */
  설정을_불러온다: () => void;
  /** 알림·그룹 등 전체 설정을 교체한다 */
  설정을_적용_한다: (next: AppSettings) => void;
  /** 그룹 멤버를 추가한다 */
  그룹_멤버를_추가_한다: (member: GroupMember) => void;
  /** 그룹 멤버를 제거한다 */
  그룹_멤버를_제거_한다: (memberId: string) => void;
  /** 알림 플래그를 토글한다 */
  알림_플래그를_토글_한다: (
    key: "notifyExpiration" | "notifyShopping" | "notifyLowStock",
  ) => void;
};

export type SettingsProviderProps = { children: ReactNode };

export const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const 설정을_불러온다 = useCallback(() => {
    setLoading(true);
    setError(null);
    try {
      const s = getAppSettings();
      setSettings(s);
    } catch (err) {
      console.error("설정 로드 오류:", err);
      setError(
        err instanceof Error
          ? err.message
          : "설정을 불러오는 중 오류가 발생했습니다.",
      );
      setSettings(null);
    } finally {
      setLoading(false);
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    설정을_불러온다();
  }, [설정을_불러온다]);

  useEffect(() => {
    if (!hydrated || !settings) return;
    try {
      persistSettings(settings);
    } catch (err) {
      console.error("설정 저장 오류:", err);
    }
  }, [settings, hydrated]);

  const 설정을_적용_한다 = useCallback((next: AppSettings) => {
    setSettings(next);
  }, []);

  const 그룹_멤버를_추가_한다 = useCallback((member: GroupMember) => {
    setSettings((s) => (s ? { ...s, groups: [...s.groups, member] } : s));
  }, []);

  const 그룹_멤버를_제거_한다 = useCallback((memberId: string) => {
    setSettings((s) =>
      s ? { ...s, groups: s.groups.filter((g) => g.id !== memberId) } : s,
    );
  }, []);

  const 알림_플래그를_토글_한다 = useCallback(
    (key: "notifyExpiration" | "notifyShopping" | "notifyLowStock") => {
      setSettings((s) => (s ? { ...s, [key]: !s[key] } : s));
    },
    [],
  );

  const value = useMemo<SettingsContextType>(
    () => ({
      settings,
      loading,
      error,
      설정을_불러온다,
      설정을_적용_한다,
      그룹_멤버를_추가_한다,
      그룹_멤버를_제거_한다,
      알림_플래그를_토글_한다,
    }),
    [
      settings,
      loading,
      error,
      설정을_불러온다,
      설정을_적용_한다,
      그룹_멤버를_추가_한다,
      그룹_멤버를_제거_한다,
      알림_플래그를_토글_한다,
    ],
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}
