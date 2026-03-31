"use client";

import { APP_PAGE_MIN_LOADING_MS } from "@/app/_ui/app-loading-state";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  getAppSettings,
  getHouseholds,
  setAppSettings as persistSettings,
} from "@/lib/local-store";
import {
  DEFAULT_NOTIFICATION_DETAIL,
  DEFAULT_SETTINGS,
  type AppSettings,
  type ExpirationAlertRule,
  type GroupMember,
  type NotificationDetailPreferences,
  type NotificationRuleScope,
} from "@/types/domain";

/* ─────────────────────── API helpers ─────────────────────── */

async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const json = (await res.json()) as {
    success: boolean;
    data: T;
    message?: string;
  };
  if (!json.success) throw new Error(json.message ?? "API 오류");
  return json.data;
}

interface ApiNotificationPreference {
  id: string;
  userId: string;
  householdId: string | null;
  notifyExpiration: boolean;
  notifyShopping: boolean;
  notifyLowStock: boolean;
  expirationDaysBefore: number;
  expirationRuleScope: string | null;
  notifyExpiredLots: boolean;
  expirationSameDayReminder: boolean;
  shoppingNotifyListUpdates: boolean;
  shoppingTripReminder: boolean;
  shoppingTripReminderWeekday: number | null;
  lowStockRespectMinLevel: boolean;
}

interface ApiExpirationAlertRule {
  id: string;
  householdId: string;
  productId: string;
  daysBefore: number;
  isActive: boolean;
}

function mapApiPreferenceToSettings(
  np: ApiNotificationPreference,
): Partial<AppSettings> {
  return {
    notifyExpiration: np.notifyExpiration,
    notifyShopping: np.notifyShopping,
    notifyLowStock: np.notifyLowStock,
    notificationDetail: {
      ...DEFAULT_NOTIFICATION_DETAIL,
      expirationDaysBefore: np.expirationDaysBefore,
      expirationRuleScope:
        (np.expirationRuleScope as NotificationRuleScope) ?? "household",
      notifyExpiredLots: np.notifyExpiredLots,
      expirationSameDayReminder: np.expirationSameDayReminder,
      shoppingNotifyListUpdates: np.shoppingNotifyListUpdates,
      shoppingTripReminder: np.shoppingTripReminder,
      shoppingTripReminderWeekday: np.shoppingTripReminderWeekday,
      lowStockRespectMinLevel: np.lowStockRespectMinLevel,
    },
  };
}

async function loadSettingsFromApi(householdId?: string): Promise<AppSettings> {
  const base: AppSettings = { ...DEFAULT_SETTINGS, groups: [] };
  try {
    const prefs = await apiFetch<ApiNotificationPreference[]>(
      "/api/notification-preferences",
    );
    const pref = prefs.find((p) => !p.householdId) ?? prefs[0];
    if (pref) {
      Object.assign(base, mapApiPreferenceToSettings(pref));
    }
  } catch {
    /* 실패 시 기본값 유지 */
  }

  if (householdId) {
    try {
      const rules = await apiFetch<ApiExpirationAlertRule[]>(
        `/api/households/${householdId}/expiration-alert-rules`,
      );
      base.expirationAlertRules = rules.map((r) => ({
        id: r.id,
        productId: r.productId,
        daysBefore: r.daysBefore,
        isActive: r.isActive,
      }));
    } catch {
      /* 실패 시 빈 배열 유지 */
    }
  }
  return base;
}

export type SettingsDataMode = "mock" | "api";

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
  /** §17·§18 정렬 알림 상세(만료 일수·스코프 등)를 부분 갱신한다 */
  알림_상세를_갱신한다: (patch: Partial<NotificationDetailPreferences>) => void;
  /** §20 품목별 만료 알림 규칙을 추가·갱신한다 */
  만료_규칙을_저장한다: (rule: ExpirationAlertRule) => void;
  /** §20 품목별 만료 알림 규칙을 삭제한다 */
  만료_규칙을_삭제한다: (ruleId: string) => void;
};

export type SettingsProviderProps = {
  children: ReactNode;
  dataMode?: SettingsDataMode;
  householdId?: string;
};

export const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

export function SettingsProvider({
  children,
  dataMode = "mock",
  householdId: householdIdProp,
}: SettingsProviderProps) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const notificationPrefIdRef = useRef<string | null>(null);

  const 설정을_불러온다 = useCallback(() => {
    if (dataMode === "api") {
      setLoading(true);
      const hid = householdIdProp ?? getHouseholds()[0]?.id;
      void loadSettingsFromApi(hid)
        .then((s) => {
          setSettings(s);
          setLoading(false);
          setHydrated(true);
        })
        .catch((err) => {
          console.error("설정 로드 오류:", err);
          setSettings(getAppSettings());
          setLoading(false);
          setHydrated(true);
        });
      return;
    }
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
  }, [dataMode, householdIdProp]);

  /** 최초 마운트만 최소 로딩 시간을 두어 대시보드와 같이 progress 막대가 보이게 함 */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const t0 =
      typeof performance !== "undefined" ? performance.now() : Date.now();

    void (async () => {
      try {
        let s: AppSettings;
        if (dataMode === "api") {
          const hid = householdIdProp ?? getHouseholds()[0]?.id;
          const [loaded] = await Promise.all([
            loadSettingsFromApi(hid),
            new Promise((r) => setTimeout(r, 0)),
          ]);
          s = loaded;
          // 알림 설정 ID를 저장해 두기 (수정 시 PUT 에 사용)
          try {
            const prefs = await apiFetch<ApiNotificationPreference[]>(
              "/api/notification-preferences",
            );
            const pref = prefs.find((p) => !p.householdId) ?? prefs[0];
            if (pref) notificationPrefIdRef.current = pref.id;
          } catch {
            /* ignore */
          }
        } else {
          s = getAppSettings();
        }
        const elapsed =
          (typeof performance !== "undefined"
            ? performance.now()
            : Date.now()) - t0;
        const rest = Math.max(0, APP_PAGE_MIN_LOADING_MS - elapsed);
        if (rest > 0) {
          await new Promise((r) => setTimeout(r, rest));
        }
        if (cancelled) return;
        setSettings(s);
      } catch (err) {
        console.error("설정 로드 오류:", err);
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "설정을 불러오는 중 오류가 발생했습니다.",
          );
          setSettings(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setHydrated(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dataMode, householdIdProp]);

  useEffect(() => {
    if (!hydrated || !settings) return;
    if (dataMode === "api") {
      // API 모드: 알림 설정을 백엔드에 저장
      const prefId = notificationPrefIdRef.current;
      const nd = settings.notificationDetail ?? DEFAULT_NOTIFICATION_DETAIL;
      const body = {
        notifyExpiration: settings.notifyExpiration,
        notifyShopping: settings.notifyShopping,
        notifyLowStock: settings.notifyLowStock,
        expirationDaysBefore: nd.expirationDaysBefore,
        expirationRuleScope: nd.expirationRuleScope,
        notifyExpiredLots: nd.notifyExpiredLots,
        expirationSameDayReminder: nd.expirationSameDayReminder,
        shoppingNotifyListUpdates: nd.shoppingNotifyListUpdates,
        shoppingTripReminder: nd.shoppingTripReminder,
        shoppingTripReminderWeekday: nd.shoppingTripReminderWeekday,
        lowStockRespectMinLevel: nd.lowStockRespectMinLevel,
      };
      if (prefId) {
        void apiFetch(`/api/notification-preferences/${prefId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }).catch((e) => console.error("알림 설정 저장 오류:", e));
      } else {
        void apiFetch("/api/notification-preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
          .then((pref) => {
            if (pref && typeof (pref as { id?: string }).id === "string") {
              notificationPrefIdRef.current = (pref as { id: string }).id;
            }
          })
          .catch((e) => console.error("알림 설정 생성 오류:", e));
      }
      return;
    }
    try {
      persistSettings(settings);
    } catch (err) {
      console.error("설정 저장 오류:", err);
    }
  }, [settings, hydrated, dataMode]);

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

  const 알림_상세를_갱신한다 = useCallback(
    (patch: Partial<NotificationDetailPreferences>) => {
      setSettings((s) =>
        s
          ? {
              ...s,
              notificationDetail: {
                ...DEFAULT_NOTIFICATION_DETAIL,
                ...s.notificationDetail,
                ...patch,
              },
            }
          : s,
      );
    },
    [],
  );

  const 만료_규칙을_저장한다 = useCallback(
    (rule: ExpirationAlertRule) => {
      setSettings((s) => {
        if (!s) return s;
        const rules = s.expirationAlertRules ?? [];
        const idx = rules.findIndex((r) => r.id === rule.id);
        const next =
          idx >= 0
            ? rules.map((r) => (r.id === rule.id ? rule : r))
            : [...rules, rule];
        return { ...s, expirationAlertRules: next };
      });

      if (dataMode === "api") {
        const hid = householdIdProp ?? getHouseholds()[0]?.id;
        if (!hid) return;
        const isNew = !settings?.expirationAlertRules?.some(
          (r) => r.id === rule.id,
        );
        if (isNew) {
          void apiFetch(`/api/households/${hid}/expiration-alert-rules`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId: rule.productId,
              daysBefore: rule.daysBefore,
              isActive: rule.isActive,
            }),
          }).catch((e) => console.error("만료 규칙 저장 오류:", e));
        } else {
          void apiFetch(
            `/api/households/${hid}/expiration-alert-rules/${rule.id}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                daysBefore: rule.daysBefore,
                isActive: rule.isActive,
              }),
            },
          ).catch((e) => console.error("만료 규칙 수정 오류:", e));
        }
      }
    },
    [dataMode, householdIdProp, settings?.expirationAlertRules],
  );

  const 만료_규칙을_삭제한다 = useCallback(
    (ruleId: string) => {
      setSettings((s) =>
        s
          ? {
              ...s,
              expirationAlertRules: (s.expirationAlertRules ?? []).filter(
                (r) => r.id !== ruleId,
              ),
            }
          : s,
      );

      if (dataMode === "api") {
        const hid = householdIdProp ?? getHouseholds()[0]?.id;
        if (!hid) return;
        void apiFetch(
          `/api/households/${hid}/expiration-alert-rules/${ruleId}`,
          {
            method: "DELETE",
          },
        ).catch((e) => console.error("만료 규칙 삭제 오류:", e));
      }
    },
    [dataMode, householdIdProp],
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
      알림_상세를_갱신한다,
      만료_규칙을_저장한다,
      만료_규칙을_삭제한다,
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
      알림_상세를_갱신한다,
      만료_규칙을_저장한다,
      만료_규칙을_삭제한다,
    ],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
