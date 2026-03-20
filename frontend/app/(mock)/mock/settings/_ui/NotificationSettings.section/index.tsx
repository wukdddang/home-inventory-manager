"use client";

import { useSettings } from "../../_hooks/useSettings";
import type { NotificationRuleScope } from "@/types/domain";

function ToggleSwitch({
  pressed,
  onClick,
  ariaLabel,
}: {
  pressed: boolean;
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={pressed}
      aria-label={ariaLabel}
      onClick={onClick}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
        pressed ? "bg-teal-500" : "bg-zinc-700"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
          pressed ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

function clampInt(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function NotificationSettingsSection() {
  const { settings, 알림_플래그를_토글_한다, 알림_상세를_갱신한다 } =
    useSettings();

  if (!settings) return null;

  const d = settings.notificationDetail;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      <h2 className="text-base font-semibold text-white">알림 설정</h2>
      <p className="mt-1 text-sm text-zinc-500">
        §17 Notification · §18 ExpirationAlertRule · InventoryItem.minStockLevel
        과 맞춘 모의 값입니다. API 연동 시 동일 필드로 저장하면 됩니다.
      </p>

      <ul className="mt-6 space-y-4">
        {/* 유통기한 */}
        <li className="rounded-xl border border-zinc-800 bg-zinc-950/60">
          <div className="flex items-start justify-between gap-4 px-4 py-3">
            <div>
              <p className="font-medium text-zinc-200">유통기한 임박·만료</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                <code className="text-zinc-400">expiration_soon</code> ·{" "}
                <code className="text-zinc-400">expired</code> 유형. 품목별
                세부 일수는 ExpirationAlertRule로 두고, 여기서는 기본 템플릿·
                스코프를 정합니다.
              </p>
            </div>
            <ToggleSwitch
              pressed={settings.notifyExpiration}
              ariaLabel="유통기한 알림 켜기"
              onClick={() => 알림_플래그를_토글_한다("notifyExpiration")}
            />
          </div>
          {settings.notifyExpiration ? (
            <div className="space-y-4 border-t border-zinc-800/80 px-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-zinc-300">
                  <span className="mb-1.5 block text-xs font-medium text-zinc-500">
                    기본 알림 시점 (일 전)
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={d.expirationDaysBefore}
                    onChange={(e) =>
                      알림_상세를_갱신한다({
                        expirationDaysBefore: clampInt(
                          Number(e.target.value),
                          1,
                          365,
                        ),
                      })
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-teal-600"
                  />
                  <span className="mt-1 block text-[11px] text-zinc-600">
                    ExpirationAlertRule.daysBefore — 신규 규칙·기본 제안값
                  </span>
                </label>

                <fieldset className="min-w-0 text-sm text-zinc-300">
                  <legend className="mb-2 text-xs font-medium text-zinc-500">
                    규칙 소유 (택1)
                  </legend>
                  <p className="mb-2 text-[11px] leading-relaxed text-zinc-600">
                    가족 공유와 개인 규칙을 같은 품목에 동시에 쓰면 알림이
                    이중일 수 있습니다. 한 축만 쓰는 것을 권장합니다.
                  </p>
                  <div className="flex flex-col gap-2">
                    {(
                      [
                        ["household", "가족·공유 그룹 (householdId)"],
                        ["personal", "개인 (userId)"],
                      ] as const satisfies readonly [
                        NotificationRuleScope,
                        string,
                      ][]
                    ).map(([value, label]) => (
                      <label
                        key={value}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-800/80 bg-zinc-900/50 px-3 py-2 has-checked:border-teal-700/60"
                      >
                        <input
                          type="radio"
                          name="expiration-rule-scope"
                          value={value}
                          checked={d.expirationRuleScope === value}
                          onChange={() =>
                            알림_상세를_갱신한다({
                              expirationRuleScope: value,
                            })
                          }
                          className="border-zinc-600 text-teal-500 focus:ring-teal-600"
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>

              <div className="space-y-3 rounded-lg border border-zinc-800/60 bg-zinc-900/30 p-3">
                <p className="text-xs font-medium text-zinc-500">세부 유형</p>
                <label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-zinc-300">
                  <span>
                    기한 지난 로트 알림{" "}
                    <span className="text-zinc-600">(type: expired)</span>
                  </span>
                  <ToggleSwitch
                    pressed={d.notifyExpiredLots}
                    ariaLabel="만료 로트 알림"
                    onClick={() =>
                      알림_상세를_갱신한다({
                        notifyExpiredLots: !d.notifyExpiredLots,
                      })
                    }
                  />
                </label>
                <label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-zinc-300">
                  <span>
                    만료 당일 한 번 더 알림
                    <span className="mt-0.5 block text-[11px] font-normal text-zinc-600">
                      스케줄러가 당일을 별도 이벤트로 처리할 때 사용. 스키마상
                      품목당 규칙 1건이면 앱 정책으로 합산합니다.
                    </span>
                  </span>
                  <ToggleSwitch
                    pressed={d.expirationSameDayReminder}
                    ariaLabel="당일 재알림"
                    onClick={() =>
                      알림_상세를_갱신한다({
                        expirationSameDayReminder: !d.expirationSameDayReminder,
                      })
                    }
                  />
                </label>
              </div>
            </div>
          ) : null}
        </li>

        {/* 장보기 */}
        <li className="rounded-xl border border-zinc-800 bg-zinc-950/60">
          <div className="flex items-start justify-between gap-4 px-4 py-3">
            <div>
              <p className="font-medium text-zinc-200">장보기·ShoppingList</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                리스트 변경 알림과 주간 리마인더(습관용). 항목 단위 필드는
                ShoppingListItem과 연동합니다.
              </p>
            </div>
            <ToggleSwitch
              pressed={settings.notifyShopping}
              ariaLabel="장보기 알림 켜기"
              onClick={() => 알림_플래그를_토글_한다("notifyShopping")}
            />
          </div>
          {settings.notifyShopping ? (
            <div className="space-y-3 border-t border-zinc-800/80 px-4 py-4">
              <label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-zinc-300">
                <span>리스트 변경·공유 시 알림</span>
                <ToggleSwitch
                  pressed={d.shoppingNotifyListUpdates}
                  ariaLabel="리스트 변경 알림"
                  onClick={() =>
                    알림_상세를_갱신한다({
                      shoppingNotifyListUpdates: !d.shoppingNotifyListUpdates,
                    })
                  }
                />
              </label>
              <label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-zinc-300">
                <span>정기 장보기 리마인더</span>
                <ToggleSwitch
                  pressed={d.shoppingTripReminder}
                  ariaLabel="장보기 리마인더"
                  onClick={() =>
                    알림_상세를_갱신한다({
                      shoppingTripReminder: !d.shoppingTripReminder,
                    })
                  }
                />
              </label>
              {d.shoppingTripReminder ? (
                <label className="block text-sm text-zinc-300">
                  <span className="mb-1.5 block text-xs text-zinc-500">
                    선호 요일
                  </span>
                  <select
                    value={
                      d.shoppingTripReminderWeekday === null
                        ? ""
                        : String(d.shoppingTripReminderWeekday)
                    }
                    onChange={(e) => {
                      const v = e.target.value;
                      알림_상세를_갱신한다({
                        shoppingTripReminderWeekday:
                          v === "" ? null : Number(v),
                      });
                    }}
                    className="w-full max-w-xs rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-teal-600"
                  >
                    <option value="">요일 미지정 (매일 체크용)</option>
                    {WEEKDAYS.map((name, i) => (
                      <option key={name} value={i}>
                        매주 {name}요일
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
          ) : null}
        </li>

        {/* 재고 부족 */}
        <li className="rounded-xl border border-zinc-800 bg-zinc-950/60">
          <div className="flex items-start justify-between gap-4 px-4 py-3">
            <div>
              <p className="font-medium text-zinc-200">재고 부족</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                <code className="text-zinc-400">low_stock</code> — 재고 줄의{" "}
                <code className="text-zinc-400">minStockLevel</code>과 비교합니다.
              </p>
            </div>
            <ToggleSwitch
              pressed={settings.notifyLowStock}
              ariaLabel="재고 부족 알림 켜기"
              onClick={() => 알림_플래그를_토글_한다("notifyLowStock")}
            />
          </div>
          {settings.notifyLowStock ? (
            <div className="border-t border-zinc-800/80 px-4 py-4">
              <label className="flex cursor-pointer items-start justify-between gap-3 text-sm text-zinc-300">
                <span>
                  최소 재고가 설정된 품목만
                  <span className="mt-1 block text-[11px] font-normal text-zinc-600">
                    minStockLevel이 NULL이면 해당 줄은 부족 알림 대상에서
                    제외됩니다.
                  </span>
                </span>
                <ToggleSwitch
                  pressed={d.lowStockRespectMinLevel}
                  ariaLabel="최소 재고 있는 품목만"
                  onClick={() =>
                    알림_상세를_갱신한다({
                      lowStockRespectMinLevel: !d.lowStockRespectMinLevel,
                    })
                  }
                />
              </label>
            </div>
          ) : null}
        </li>
      </ul>
    </section>
  );
}
