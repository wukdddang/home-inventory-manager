"use client";

import { APP_PAGE_MIN_LOADING_MS } from "@/app/_ui/app-loading-state";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getAppSettings,
  getHouseholds,
  setAppSettings as persistLocalSettings,
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

/* ─────────────────────── Port ─────────────────────── */

/**
 * 설정 데이터 소스 포트.
 * mock(localStorage)과 api(백엔드) 모두 이 인터페이스를 구현한다.
 */
export type SettingsDataPort = {
  /** 설정을 로드한다. api는 백엔드, mock은 localStorage. */
  loadSettings(householdId?: string): Promise<AppSettings>;
  /** 설정이 변경될 때 호출된다. api는 PUT/POST, mock은 localStorage 저장. */
  persistSettings(settings: AppSettings): Promise<void>;
  /** 만료 규칙을 저장한다 (신규: POST, 수정: PUT). */
  saveExpirationRule(
    householdId: string | undefined,
    rule: ExpirationAlertRule,
    isNew: boolean,
  ): Promise<void>;
  /** 만료 규칙을 삭제한다. */
  deleteExpirationRule(
    householdId: string | undefined,
    ruleId: string,
  ): Promise<void>;
};

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

/** api 서비스 인스턴스를 생성한다. notificationPrefId를 클로저로 관리한다. */
function createSettingsApiService(): SettingsDataPort {
  let notificationPrefId: string | null = null;

  return {
    async loadSettings(householdId) {
      const base: AppSettings = { ...DEFAULT_SETTINGS, groups: [] };
      try {
        const prefs = await apiFetch<ApiNotificationPreference[]>(
          "/api/notification-preferences",
        );
        const pref = prefs.find((p) => !p.householdId) ?? prefs[0];
        if (pref) {
          notificationPrefId = pref.id;
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
    },

    async persistSettings(settings) {
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
      if (notificationPrefId) {
        await apiFetch(`/api/notification-preferences/${notificationPrefId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }).catch((e) => console.error("알림 설정 저장 오류:", e));
      } else {
        await apiFetch<{ id?: string }>("/api/notification-preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
          .then((pref) => {
            if (pref && typeof pref.id === "string") {
              notificationPrefId = pref.id;
            }
          })
          .catch((e) => console.error("알림 설정 생성 오류:", e));
      }
    },

    async saveExpirationRule(householdId, rule, isNew) {
      if (!householdId) return;
      if (isNew) {
        await apiFetch(
          `/api/households/${householdId}/expiration-alert-rules`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId: rule.productId,
              daysBefore: rule.daysBefore,
              isActive: rule.isActive,
            }),
          },
        ).catch((e) => console.error("만료 규칙 저장 오류:", e));
      } else {
        await apiFetch(
          `/api/households/${householdId}/expiration-alert-rules/${rule.id}`,
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
    },

    async deleteExpirationRule(householdId, ruleId) {
      if (!householdId) return;
      await apiFetch(
        `/api/households/${householdId}/expiration-alert-rules/${ruleId}`,
        { method: "DELETE" },
      ).catch((e) => console.error("만료 규칙 삭제 오류:", e));
    },
  };
}

/* ─────────────────────── Context Type ─────────────────────── */

export type SettingsContextType = {
  settings: AppSettings | null;
  loading: boolean;
  error: string | null;
  설정을_불러온다: () => void;
  설정을_적용_한다: (next: AppSettings) => void;
  그룹_멤버를_추가_한다: (member: GroupMember) => void;
  그룹_멤버를_제거_한다: (memberId: string) => void;
  알림_플래그를_토글_한다: (
    key: "notifyExpiration" | "notifyShopping" | "notifyLowStock",
  ) => void;
  알림_상세를_갱신한다: (patch: Partial<NotificationDetailPreferences>) => void;
  만료_규칙을_저장한다: (rule: ExpirationAlertRule) => void;
  만료_규칙을_삭제한다: (ruleId: string) => void;
};

export type SettingsProviderProps = {
  children: ReactNode;
  port: SettingsDataPort;
  householdId?: string;
};

export const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

/* ─────────────────────── Base Provider ─────────────────────── */

export function SettingsProvider({
  children,
  port,
  householdId: householdIdProp,
}: SettingsProviderProps) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const 설정을_불러온다 = useCallback(() => {
    setLoading(true);
    setError(null);
    const hid = householdIdProp ?? getHouseholds()[0]?.id;
    void port
      .loadSettings(hid)
      .then((s) => {
        setSettings(s);
        setLoading(false);
        setHydrated(true);
      })
      .catch((err) => {
        console.error("설정 로드 오류:", err);
        setError(
          err instanceof Error
            ? err.message
            : "설정을 불러오는 중 오류가 발생했습니다.",
        );
        setSettings(null);
        setLoading(false);
        setHydrated(true);
      });
  }, [port, householdIdProp]);

  // 최초 마운트: 최소 로딩 시간 보장
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const t0 =
      typeof performance !== "undefined" ? performance.now() : Date.now();

    void (async () => {
      try {
        const hid = householdIdProp ?? getHouseholds()[0]?.id;
        const s = await port.loadSettings(hid);
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
  }, [port, householdIdProp]);

  // 설정 변경 시 포트를 통해 저장 (api: 백엔드, mock: localStorage)
  useEffect(() => {
    if (!hydrated || !settings) return;
    void port
      .persistSettings(settings)
      .catch((err) => console.error("설정 저장 오류:", err));
  }, [settings, hydrated, port]);

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

      const hid = householdIdProp ?? getHouseholds()[0]?.id;
      const isNew = !settings?.expirationAlertRules?.some(
        (r) => r.id === rule.id,
      );
      void port
        .saveExpirationRule(hid, rule, isNew)
        .catch((e) => console.error("만료 규칙 저장 포트 오류:", e));
    },
    [port, householdIdProp, settings?.expirationAlertRules],
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

      const hid = householdIdProp ?? getHouseholds()[0]?.id;
      void port
        .deleteExpirationRule(hid, ruleId)
        .catch((e) => console.error("만료 규칙 삭제 포트 오류:", e));
    },
    [port, householdIdProp],
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
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

/* ─────────────────────── Current Provider ─────────────────────── */

/** current 경로 전용 Provider. 백엔드 API 서비스를 주입한다. */
export function CurrentSettingsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [port] = useState<SettingsDataPort>(() => createSettingsApiService());

  return <SettingsProvider port={port}>{children}</SettingsProvider>;
}
