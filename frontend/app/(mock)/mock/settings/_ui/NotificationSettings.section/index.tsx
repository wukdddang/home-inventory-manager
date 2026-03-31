"use client";

import { useSettings } from "../../_hooks/useSettings";
import { useDashboard } from "../../../dashboard/_hooks/useDashboard";
import { MotionModalLayer } from "@/app/_ui/motion-modal-layer";
import type {
  ExpirationAlertRule,
  NotificationRuleScope,
} from "@/types/domain";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useState, useId } from "react";
import {
  Bell,
  ShoppingCart,
  TrendingDown,
  Plus,
  Trash2,
  Settings2,
  X,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";

/* ── 공통 UI ── */

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
      <ToggleSwitch
        pressed={pressed}
        ariaLabel={ariaLabel}
        onClick={onToggle}
      />
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

/* ── 설정 모달 래퍼 ── */

function SettingsModal({
  open,
  onClose,
  title,
  description,
  icon,
  iconBg,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon: React.ReactNode;
  iconBg: string;
  children: React.ReactNode;
}) {
  const uid = useId().replace(/:/g, "");
  const titleId = `notif-modal-title-${uid}`;

  return (
    <MotionModalLayer
      open={open}
      onOpenChange={(v) => !v && onClose()}
      closeOnOverlayClick
      panelClassName="fixed left-1/2 top-1/2 z-10041 max-h-[min(100dvh-2rem,44rem)] w-[min(100vw-2rem,32rem)] -translate-x-1/2 -translate-y-1/2 outline-none"
      ariaLabelledBy={titleId}
    >
      <div className="flex max-h-[min(100dvh-2rem,44rem)] flex-col rounded-2xl border border-zinc-700 bg-zinc-900 shadow-xl">
        {/* header */}
        <div className="flex items-start justify-between gap-3 border-b border-zinc-800 p-5 pb-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                iconBg,
              )}
            >
              {icon}
            </div>
            <div>
              <h2 id={titleId} className="text-lg font-semibold text-white">
                {title}
              </h2>
              {description && (
                <p className="mt-0.5 text-sm text-zinc-400">{description}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
            aria-label="닫기"
          >
            <X className="size-4" />
          </button>
        </div>
        {/* body */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-5">
          {children}
        </div>
        {/* footer */}
        <div className="flex shrink-0 justify-end border-t border-zinc-800 p-4">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl bg-teal-500 px-5 py-2 text-sm font-semibold text-zinc-950 hover:bg-teal-400"
          >
            닫기
          </button>
        </div>
      </div>
    </MotionModalLayer>
  );
}

/* ── 요약 카드 ── */

function NotificationCard({
  icon,
  iconBg,
  title,
  summary,
  pressed,
  ariaLabel,
  onToggle,
  onConfigure,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  summary: string;
  pressed: boolean;
  ariaLabel: string;
  onToggle: () => void;
  onConfigure: () => void;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60">
      <div className="flex items-center gap-4 px-4 py-3.5">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            iconBg,
          )}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-zinc-100">{title}</p>
          <p className="mt-0.5 truncate text-xs text-zinc-500">{summary}</p>
        </div>
        <button
          type="button"
          onClick={onConfigure}
          disabled={!pressed}
          className={cn(
            "shrink-0 rounded-lg p-2 transition",
            pressed
              ? "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              : "pointer-events-none text-zinc-700",
          )}
          aria-label={`${title} 상세 설정`}
        >
          <Settings2 className="size-4" />
        </button>
        <ToggleSwitch
          pressed={pressed}
          ariaLabel={ariaLabel}
          onClick={onToggle}
        />
      </div>
    </div>
  );
}

/* ── 유통기한 모달 본문 ── */

function ExpirationModalBody() {
  const { settings, 알림_상세를_갱신한다 } = useSettings();
  if (!settings) return null;
  const d = settings.notificationDetail;

  return (
    <div className="space-y-6">
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
              ] as const satisfies readonly [NotificationRuleScope, string][]
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
                    알림_상세를_갱신한다({ expirationRuleScope: value })
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
            알림_상세를_갱신한다({ notifyExpiredLots: !d.notifyExpiredLots })
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

      {/* 품목별 만료 알림 일수 오버라이드 */}
      <PerProductExpirationRules />
    </div>
  );
}

/* ── 품목별 만료 규칙 ── */

function PerProductExpirationRules() {
  const { settings, 만료_규칙을_저장한다, 만료_규칙을_삭제한다 } =
    useSettings();
  const { households, 거점_카탈로그를_가져온다 } = useDashboard();
  const productCatalog = households[0]
    ? 거점_카탈로그를_가져온다(households[0].id)
    : { units: [], categories: [], products: [], variants: [] };
  const [addingProductId, setAddingProductId] = useState("");
  const [addingDays, setAddingDays] = useState(3);
  const selectId = useId();

  const rules = settings?.expirationAlertRules ?? [];
  const products = productCatalog?.products ?? [];
  const categories = productCatalog?.categories ?? [];
  const usedProductIds = new Set(rules.map((r) => r.productId));
  const availableProducts = products.filter((p) => !usedProductIds.has(p.id));

  const productName = (productId: string) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return productId;
    const cat = categories.find((c) => c.id === p.categoryId);
    return cat ? `${cat.name} > ${p.name}` : p.name;
  };

  const handleAdd = () => {
    if (!addingProductId) return;
    만료_규칙을_저장한다({
      id: crypto.randomUUID(),
      productId: addingProductId,
      daysBefore: clampInt(addingDays, 1, 365),
      isActive: true,
    });
    const p = products.find((x) => x.id === addingProductId);
    toast({
      title: "만료 알림 규칙을 추가했습니다",
      description: p ? productName(p.id) : undefined,
    });
    setAddingProductId("");
    setAddingDays(settings?.notificationDetail.expirationDaysBefore ?? 3);
  };

  const handleDaysChange = (rule: ExpirationAlertRule, days: number) => {
    만료_규칙을_저장한다({ ...rule, daysBefore: clampInt(days, 1, 365) });
  };

  const handleToggle = (rule: ExpirationAlertRule) => {
    만료_규칙을_저장한다({ ...rule, isActive: !rule.isActive });
  };

  return (
    <div className="space-y-3 rounded-lg border border-zinc-800/60 bg-zinc-900/30 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-zinc-200">품목별 알림 일수</p>
        <p className="mt-0.5 text-xs text-zinc-500">
          전역 기본값과 다르게 알림 받을 품목을 설정합니다
        </p>
      </div>

      {rules.length > 0 && (
        <div className="space-y-2">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2",
                rule.isActive
                  ? "border-zinc-700/80 bg-zinc-900/50"
                  : "border-zinc-800/50 bg-zinc-950/30 opacity-60",
              )}
            >
              <ToggleSwitch
                pressed={rule.isActive}
                ariaLabel={`${productName(rule.productId)} 알림 켜기`}
                onClick={() => handleToggle(rule)}
              />
              <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">
                {productName(rule.productId)}
              </span>
              <div className="flex shrink-0 items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={rule.daysBefore}
                  onChange={(e) =>
                    handleDaysChange(rule, Number(e.target.value))
                  }
                  className={cn(inputClass, "w-16 text-center")}
                  aria-label={`${productName(rule.productId)} 알림 일수`}
                />
                <span className="text-xs text-zinc-400">일 전</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  만료_규칙을_삭제한다(rule.id);
                  toast({
                    title: "만료 알림 규칙을 삭제했습니다",
                    description: productName(rule.productId),
                    variant: "destructive",
                  });
                }}
                className="shrink-0 rounded p-1 text-zinc-500 transition hover:bg-zinc-800 hover:text-rose-400"
                aria-label={`${productName(rule.productId)} 규칙 삭제`}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {availableProducts.length > 0 && (
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <label
              htmlFor={selectId}
              className="block text-xs font-medium text-zinc-400"
            >
              품목 선택
            </label>
            <select
              id={selectId}
              value={addingProductId}
              onChange={(e) => setAddingProductId(e.target.value)}
              className={cn(inputClass, "text-sm")}
            >
              <option value="">품목을 선택하세요</option>
              {availableProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {productName(p.id)}
                </option>
              ))}
            </select>
          </div>
          <div className="shrink-0 space-y-1">
            <label className="block text-xs font-medium text-zinc-400">
              일수
            </label>
            <input
              type="number"
              min={1}
              max={365}
              value={addingDays}
              onChange={(e) => setAddingDays(Number(e.target.value))}
              className={cn(inputClass, "w-16 text-center")}
              aria-label="새 규칙 알림 일수"
            />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!addingProductId}
            className={cn(
              "flex h-9.5 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition",
              addingProductId
                ? "border-teal-600/50 bg-teal-500/10 text-teal-300 hover:bg-teal-500/20"
                : "cursor-not-allowed border-zinc-800 bg-zinc-900/50 text-zinc-600",
            )}
          >
            <Plus className="size-3.5" />
            추가
          </button>
        </div>
      )}

      {availableProducts.length === 0 && rules.length > 0 && (
        <p className="text-xs text-zinc-500">
          모든 품목에 개별 규칙이 설정되어 있습니다
        </p>
      )}

      {products.length === 0 && (
        <p className="text-xs text-zinc-500">
          카탈로그에 등록된 품목이 없습니다. 상품 카탈로그에서 품목을 먼저
          추가하세요.
        </p>
      )}
    </div>
  );
}

/* ── 장보기 모달 본문 ── */

function ShoppingModalBody() {
  const { settings, 알림_상세를_갱신한다 } = useSettings();
  if (!settings) return null;
  const d = settings.notificationDetail;

  return (
    <div className="space-y-4">
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
                shoppingTripReminderWeekday: v === "" ? null : Number(v),
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
  );
}

/* ── 재고 부족 모달 본문 ── */

function LowStockModalBody() {
  const { settings, 알림_상세를_갱신한다 } = useSettings();
  if (!settings) return null;
  const d = settings.notificationDetail;

  return (
    <div>
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
  );
}

/* ── 요약 텍스트 헬퍼 ── */

function expirationSummary(
  enabled: boolean,
  daysBefore: number,
  ruleCount: number,
) {
  if (!enabled) return "꺼짐";
  const parts = [`${daysBefore}일 전 알림`];
  if (ruleCount > 0) parts.push(`품목별 ${ruleCount}건`);
  return parts.join(" · ");
}

function shoppingSummary(
  enabled: boolean,
  listUpdates: boolean,
  reminder: boolean,
) {
  if (!enabled) return "꺼짐";
  const parts: string[] = [];
  if (listUpdates) parts.push("목록 변경");
  if (reminder) parts.push("정기 리마인더");
  return parts.length > 0 ? parts.join(" · ") : "상세 설정 없음";
}

function lowStockSummary(enabled: boolean, respectMin: boolean) {
  if (!enabled) return "꺼짐";
  return respectMin ? "최소 재고 설정 품목만" : "모든 품목";
}

/* ── 메인 섹션 ── */

export function NotificationSettingsSection() {
  const { settings, 알림_플래그를_토글_한다, 알림_설정을_초기화_한다 } =
    useSettings();
  const [openModal, setOpenModal] = useState<
    "expiration" | "shopping" | "lowStock" | null
  >(null);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!settings) return null;

  const handleResetConfirm = () => {
    알림_설정을_초기화_한다();
    setConfirmReset(false);
    toast({
      title: "알림 설정을 초기화했습니다",
      description: "모든 알림 설정이 기본값으로 되돌아갔습니다.",
    });
  };

  const d = settings.notificationDetail;
  const ruleCount = settings.expirationAlertRules?.length ?? 0;

  return (
    <>
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <h2 className="text-base font-semibold text-white">알림 설정</h2>
        <p className="mt-1 text-sm text-zinc-400">
          유통기한·장보기·재고 부족 알림의 기본값을 설정합니다. 톱니바퀴를 눌러
          상세 설정을 조정하세요.
        </p>

        <div className="mt-6 space-y-3">
          <NotificationCard
            icon={<Bell className="size-4" />}
            iconBg="bg-violet-500/15 text-violet-300"
            title="유통기한 알림"
            summary={expirationSummary(
              settings.notifyExpiration,
              d.expirationDaysBefore,
              ruleCount,
            )}
            pressed={settings.notifyExpiration}
            ariaLabel="유통기한 알림 켜기"
            onToggle={() => 알림_플래그를_토글_한다("notifyExpiration")}
            onConfigure={() => setOpenModal("expiration")}
          />
          <NotificationCard
            icon={<ShoppingCart className="size-4" />}
            iconBg="bg-teal-500/15 text-teal-300"
            title="장보기 알림"
            summary={shoppingSummary(
              settings.notifyShopping,
              d.shoppingNotifyListUpdates,
              d.shoppingTripReminder,
            )}
            pressed={settings.notifyShopping}
            ariaLabel="장보기 알림 켜기"
            onToggle={() => 알림_플래그를_토글_한다("notifyShopping")}
            onConfigure={() => setOpenModal("shopping")}
          />
          <NotificationCard
            icon={<TrendingDown className="size-4" />}
            iconBg="bg-amber-500/15 text-amber-300"
            title="재고 부족 알림"
            summary={lowStockSummary(
              settings.notifyLowStock,
              d.lowStockRespectMinLevel,
            )}
            pressed={settings.notifyLowStock}
            ariaLabel="재고 부족 알림 켜기"
            onToggle={() => 알림_플래그를_토글_한다("notifyLowStock")}
            onConfigure={() => setOpenModal("lowStock")}
          />
        </div>

        {/* 초기화 존 */}
        <div className="mt-6 rounded-xl border border-rose-900/40 bg-rose-950/20 px-4 py-3.5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-rose-300">
                알림 설정 초기화
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                모든 알림 설정을 기본값으로 되돌리고 백엔드 레코드를 삭제합니다
              </p>
            </div>
            {confirmReset ? (
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-zinc-400">정말 초기화할까요?</span>
                <button
                  type="button"
                  onClick={handleResetConfirm}
                  className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-500"
                >
                  초기화
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800"
                >
                  취소
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-rose-800/50 bg-rose-950/40 px-3 py-1.5 text-xs font-medium text-rose-400 transition hover:bg-rose-900/30 hover:text-rose-300"
              >
                <RotateCcw className="size-3.5" />
                초기화
              </button>
            )}
          </div>
          {confirmReset && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-900/30 bg-rose-950/30 px-3 py-2">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-rose-400" />
              <p className="text-xs text-rose-300/80">
                이 작업은 되돌릴 수 없습니다. 유통기한·장보기·재고 부족 알림 설정과 품목별 만료 규칙이 모두 초기화됩니다.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── 모달들 ── */}
      <SettingsModal
        open={openModal === "expiration"}
        onClose={() => setOpenModal(null)}
        title="유통기한 알림"
        description="유통기한이 가까워지거나 지난 품목을 알려줍니다"
        icon={<Bell className="size-4" />}
        iconBg="bg-violet-500/15 text-violet-300"
      >
        <ExpirationModalBody />
      </SettingsModal>

      <SettingsModal
        open={openModal === "shopping"}
        onClose={() => setOpenModal(null)}
        title="장보기 알림"
        description="장보기 목록 변경과 정기 리마인더를 설정합니다"
        icon={<ShoppingCart className="size-4" />}
        iconBg="bg-teal-500/15 text-teal-300"
      >
        <ShoppingModalBody />
      </SettingsModal>

      <SettingsModal
        open={openModal === "lowStock"}
        onClose={() => setOpenModal(null)}
        title="재고 부족 알림"
        description="수량이 최소 재고 이하로 떨어지면 알립니다"
        icon={<TrendingDown className="size-4" />}
        iconBg="bg-amber-500/15 text-amber-300"
      >
        <LowStockModalBody />
      </SettingsModal>
    </>
  );
}
