"use client";

import { useSettings } from "../../_hooks/useSettings";

const ROWS = [
  {
    key: "notifyExpiration" as const,
    label: "유통기한 임박 알림",
    desc: "만료 N일 전 푸시/이메일 (정책은 서버 규칙과 맞출 것)",
  },
  {
    key: "notifyShopping" as const,
    label: "장보기 리스트 알림",
    desc: "ShoppingList 관련 알림",
  },
  {
    key: "notifyLowStock" as const,
    label: "재고 부족 알림",
    desc: "임계 수량 이하일 때 알림",
  },
];

export function NotificationSettingsSection() {
  const { settings, 알림_플래그를_토글_한다 } = useSettings();

  if (!settings) return null;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      <h2 className="text-base font-semibold text-white">알림 설정</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Notification·ExpirationAlertRule 연동 시 이 값을 서버에 저장합니다.
      </p>
      <ul className="mt-6 space-y-4">
        {ROWS.map((row) => (
          <li
            key={row.key}
            className="flex items-start justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3"
          >
            <div>
              <p className="font-medium text-zinc-200">{row.label}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{row.desc}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings[row.key]}
              onClick={() => 알림_플래그를_토글_한다(row.key)}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                settings[row.key] ? "bg-teal-500" : "bg-zinc-700"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  settings[row.key] ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
