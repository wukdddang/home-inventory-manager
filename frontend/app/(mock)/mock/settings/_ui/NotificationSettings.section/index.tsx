"use client";

import { useSettings } from "../../_hooks/useSettings";
import type { NotificationRuleScope } from "@/types/domain";
import { cn } from "@/lib/utils";
import { Bell, ShoppingCart, TrendingDown } from "lucide-react";

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
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        pressed ? "bg-teal-500" : "bg-zinc-700",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
          pressed ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}

function SettingRow({
  label,
  description,
  pressed,
  ariaLabel,
  onToggle,
}: {
  label: string;
  description?: string;
  pressed: boolean;
  ariaLabel: string;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-zinc-200">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
        )}
      </div>
      <ToggleSwitch pressed={pressed} ariaLabel={ariaLabel} onClick={onToggle} />
    </div>
  );
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30";

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
      <p className="mt-1 text-sm text-zinc-400">
        유통기한·장보기·재고 부족 알림의 기본값을 설정합니다.
      </p>

      <div className="mt-6 space-y-4">
        {/* ── 유통기한 ── */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60">
          <div className="flex items-start justify-between gap-4 px-4 py-3.5">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
                <Bell className="size-4" />
              </div>
              <div>
                <p className="font-medium text-zinc-100">유통기한 알림</p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  유통기한이 가까워지거나 지난 품목을 알려줍니다
                </p>
              </div>
            </div>
            <ToggleSwitch
              pressed={settings.notifyExpiration}
              ariaLabel="유통기한 알림 켜기"
              onClick={() => 알림_플래그를_토글_한다("notifyExpiration")}
            />
          </div>

          {settings.notifyExpiration && (
            <div className="space-y-5 border-t border-zinc-800/80 px-4 py-4">
              {/* 기본 알림 시점 + 규칙 소유 */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="exp-days"
                    className="block text-xs font-medium text-zinc-300"
                  >
                    기본 알림 시점
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="exp-days"
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
                      className={cn(inputClass, "max-w-20")}
                    />
                    <span className="text-sm text-zinc-400">일 전</span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    품목별로 다르게 설정하지 않은 경우 이 값을 기준으로 알립니다
                  </p>
                </div>

                <fieldset className="min-w-0 space-y-2">
                  <legend className="text-xs font-medium text-zinc-300">
                    알림 범위
                  </legend>
                  <div className="flex flex-col gap-1.5">
                    {(
                      [
                        ["household", "가족·거점 공유"],
                        ["personal", "개인"],
                      ] as const satisfies readonly [
                        NotificationRuleScope,
                        string,
                      ][]
                    ).map(([value, label]) => (
                      <label
                        key={value}
                        className={cn(
                          "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition",
                          d.expirationRuleScope === value
                            ? "border-teal-600/50 bg-teal-500/8 text-zinc-100"
                            : "border-zinc-800/80 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700",
                        )}
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
                  <p className="text-xs text-zinc-500">
                    가족 공유와 개인을 동시에 쓰면 알림이 중복될 수 있습니다
                  </p>
                </fieldset>
              </div>

              {/* 세부 옵션 */}
              <div className="space-y-3 rounded-lg border border-zinc-800/60 bg-zinc-900/30 px-4 py-3">
                <SettingRow
                  label="만료된 로트 알림"
                  description="유통기한이 이미 지난 품목도 알립니다"
                  pressed={d.notifyExpiredLots}
                  ariaLabel="만료 로트 알림"
                  onToggle={() =>
                    알림_상세를_갱신한다({
                      notifyExpiredLots: !d.notifyExpiredLots,
                    })
                  }
                />
                <div className="border-t border-zinc-800/40" />
                <SettingRow
                  label="만료 당일 재알림"
                  description="만료일에 한 번 더 알림을 받습니다"
                  pressed={d.expirationSameDayReminder}
                  ariaLabel="당일 재알림"
                  onToggle={() =>
                    알림_상세를_갱신한다({
                      expirationSameDayReminder: !d.expirationSameDayReminder,
                    })
                  }
                />
              </div>
            </div>
          )}
        </div>

        {/* ── 장보기 ── */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60">
          <div className="flex items-start justify-between gap-4 px-4 py-3.5">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-500/15 text-teal-300">
                <ShoppingCart className="size-4" />
              </div>
              <div>
                <p className="font-medium text-zinc-100">장보기 알림</p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  장보기 목록 변경과 정기 리마인더를 설정합니다
                </p>
              </div>
            </div>
            <ToggleSwitch
              pressed={settings.notifyShopping}
              ariaLabel="장보기 알림 켜기"
              onClick={() => 알림_플래그를_토글_한다("notifyShopping")}
            />
          </div>

          {settings.notifyShopping && (
            <div className="space-y-3 border-t border-zinc-800/80 px-4 py-4">
              <SettingRow
                label="목록 변경·공유 알림"
                description="다른 멤버가 장보기 목록을 수정하면 알립니다"
                pressed={d.shoppingNotifyListUpdates}
                ariaLabel="리스트 변경 알림"
                onToggle={() =>
                  알림_상세를_갱신한다({
                    shoppingNotifyListUpdates: !d.shoppingNotifyListUpdates,
                  })
                }
              />
              <div className="border-t border-zinc-800/40" />
              <SettingRow
                label="정기 장보기 리마인더"
                description="주기적으로 장보기를 상기시켜 줍니다"
                pressed={d.shoppingTripReminder}
                ariaLabel="장보기 리마인더"
                onToggle={() =>
                  알림_상세를_갱신한다({
                    shoppingTripReminder: !d.shoppingTripReminder,
                  })
                }
              />
              {d.shoppingTripReminder && (
                <div className="ml-11 space-y-1.5">
                  <label
                    htmlFor="trip-weekday"
                    className="block text-xs font-medium text-zinc-300"
                  >
                    선호 요일
                  </label>
                  <select
                    id="trip-weekday"
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
                    className={cn(inputClass, "max-w-48")}
                  >
                    <option value="">요일 미지정</option>
                    {WEEKDAYS.map((name, i) => (
                      <option key={name} value={i}>
                        매주 {name}요일
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 재고 부족 ── */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60">
          <div className="flex items-start justify-between gap-4 px-4 py-3.5">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-300">
                <TrendingDown className="size-4" />
              </div>
              <div>
                <p className="font-medium text-zinc-100">재고 부족 알림</p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  수량이 최소 재고 이하로 떨어지면 알립니다
                </p>
              </div>
            </div>
            <ToggleSwitch
              pressed={settings.notifyLowStock}
              ariaLabel="재고 부족 알림 켜기"
              onClick={() => 알림_플래그를_토글_한다("notifyLowStock")}
            />
          </div>

          {settings.notifyLowStock && (
            <div className="border-t border-zinc-800/80 px-4 py-4">
              <SettingRow
                label="최소 재고가 설정된 품목만"
                description="최소 재고를 지정하지 않은 품목은 부족 알림에서 제외됩니다"
                pressed={d.lowStockRespectMinLevel}
                ariaLabel="최소 재고 있는 품목만"
                onToggle={() =>
                  알림_상세를_갱신한다({
                    lowStockRespectMinLevel: !d.lowStockRespectMinLevel,
                  })
                }
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
