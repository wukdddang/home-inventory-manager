"use client";

import { Calendar, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export type PeriodFilterProps = {
  /** 접근성·라벨 — 예: "일시(기록일)", "구매일" */
  dateFieldLabel: string;
  periodStart: string;
  periodEnd: string;
  onPeriodStartChange: (value: string) => void;
  onPeriodEndChange: (value: string) => void;
  onClear: () => void;
  /** 검색 입력과 같은 툴바 행 — 높이 h-9 */
  variant?: "toolbar" | "compact";
};

const dateInputCompactClass =
  "box-border h-8 min-w-0 flex-1 cursor-pointer rounded-md border border-zinc-600/90 bg-zinc-950 px-2 py-0 pr-16 text-xs tabular-nums text-zinc-100 outline-none focus:border-teal-500";

const dateInputToolbarClass =
  "box-border h-9 min-w-0 flex-1 cursor-pointer rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-0 pr-16 text-sm tabular-nums text-zinc-100 outline-none focus:border-teal-500";

function 날짜를_YMD로_표시한다(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function YMD를_날짜로_파싱한다(ymd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return null;
  const y = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const d = new Date(y, month - 1, day);
  if (
    d.getFullYear() !== y ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day
  ) {
    return null;
  }
  return d;
}

function 월_시작일(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function 월_말일(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function CalendarDateField({
  value,
  onChange,
  ariaLabel,
  placeholder,
  inputClassName,
  minYmd,
  maxYmd,
}: {
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
  placeholder: string;
  inputClassName: string;
  minYmd?: string;
  maxYmd?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedDate = useMemo(() => YMD를_날짜로_파싱한다(value), [value]);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(
    () => selectedDate ?? new Date(),
  );

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  const viewStart = 월_시작일(viewDate);
  const firstWeekday = viewStart.getDay();
  const daysInMonth = 월_말일(viewDate).getDate();
  const cells: Array<{ label: string; ymd: string; muted?: boolean }> = [];

  for (let i = 0; i < firstWeekday; i++) {
    cells.push({ label: "", ymd: "", muted: true });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    cells.push({ label: String(day), ymd: 날짜를_YMD로_표시한다(d) });
  }

  const 날짜가_선택가능한가 = (ymd: string): boolean => {
    if (minYmd && ymd < minYmd) return false;
    if (maxYmd && ymd > maxYmd) return false;
    return true;
  };

  return (
    <div
      ref={rootRef}
      className="relative flex min-w-0 max-w-56 flex-1 items-center"
    >
      <button
        type="button"
        aria-label={ariaLabel}
        className={`${inputClassName} overflow-hidden whitespace-nowrap text-left ${value ? "text-zinc-100" : "text-zinc-400"}`}
        onClick={() => {
          setViewDate(selectedDate ?? new Date());
          setOpen((v) => !v);
        }}
      >
        {value || placeholder}
      </button>
      <button
        type="button"
        className="absolute right-1 top-1/2 inline-flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-teal-300/95"
        aria-label={`${ariaLabel} — 캘린더에서 선택`}
        title="캘린더에서 선택"
        onClick={() => {
          setViewDate(selectedDate ?? new Date());
          setOpen((v) => !v);
        }}
      >
        <Calendar className="size-4 shrink-0" aria-hidden />
      </button>
      {open ? (
        <div className="absolute left-0 top-[calc(100%+6px)] z-30 w-64 rounded-lg border border-zinc-700 bg-zinc-950 p-2 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              className="inline-flex size-7 items-center justify-center rounded border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              onClick={() =>
                setViewDate(
                  new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1),
                )
              }
              aria-label="이전 달"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <p className="text-sm font-medium text-zinc-200">
              {viewDate.getFullYear()}년 {viewDate.getMonth() + 1}월
            </p>
            <button
              type="button"
              className="inline-flex size-7 items-center justify-center rounded border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              onClick={() =>
                setViewDate(
                  new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1),
                )
              }
              aria-label="다음 달"
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>
          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] text-zinc-400">
            <span>일</span>
            <span>월</span>
            <span>화</span>
            <span>수</span>
            <span>목</span>
            <span>금</span>
            <span>토</span>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((c, i) =>
              c.ymd ? (
                날짜가_선택가능한가(c.ymd) ? (
                  <button
                    key={`${c.ymd}-${i}`}
                    type="button"
                    onClick={() => {
                      onChange(c.ymd);
                      setOpen(false);
                    }}
                    className={`h-8 rounded text-xs tabular-nums ${
                      value === c.ymd
                        ? "bg-teal-500/25 text-teal-100 ring-1 ring-teal-500/50"
                        : "text-zinc-200 hover:bg-zinc-800"
                    }`}
                  >
                    {c.label}
                  </button>
                ) : (
                  <span
                    key={`${c.ymd}-${i}`}
                    className="inline-flex h-8 items-center justify-center rounded text-xs tabular-nums text-zinc-600"
                  >
                    {c.label}
                  </span>
                )
              ) : (
                <span key={`blank-${i}`} className="h-8" aria-hidden />
              ),
            )}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              className="rounded px-1.5 py-1 text-[11px] text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              지우기
            </button>
            <button
              type="button"
              className="rounded px-1.5 py-1 text-[11px] text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              onClick={() => {
                onChange(날짜를_YMD로_표시한다(new Date()));
                setOpen(false);
              }}
              disabled={!날짜가_선택가능한가(날짜를_YMD로_표시한다(new Date()))}
            >
              오늘
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** 검색·거점 선택과 같은 툴바 행에 둔다 */
export function PeriodFilterToolbar({
  dateFieldLabel,
  periodStart,
  periodEnd,
  onPeriodStartChange,
  onPeriodEndChange,
  onClear,
  variant = "toolbar",
}: PeriodFilterProps) {
  const active = Boolean(periodStart || periodEnd);
  const inputClass =
    variant === "toolbar" ? dateInputToolbarClass : dateInputCompactClass;
  const clearBtnClass =
    variant === "toolbar"
      ? "inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-600 px-3 text-sm font-medium text-teal-300/95 hover:border-teal-500/50 hover:bg-zinc-800/80"
      : "inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-zinc-600 px-2.5 text-xs font-medium text-teal-300/95 hover:border-teal-500/50 hover:bg-zinc-800/80";
  return (
    <div
      className="flex min-w-0 shrink-0 flex-wrap items-center gap-x-2 gap-y-2 px-2 py-1.5"
      role="group"
      aria-label={`기간 필터, ${dateFieldLabel}`}
    >
      <label className="flex min-w-0 flex-1 items-center gap-1.5 sm:max-w-56">
        <span className="sr-only">시작일</span>
        <CalendarDateField
          value={periodStart}
          onChange={onPeriodStartChange}
          ariaLabel={`기간 시작일, ${dateFieldLabel} 기준`}
          placeholder="시작일"
          maxYmd={periodEnd || undefined}
          inputClassName={inputClass}
        />
      </label>
      <span className="shrink-0 text-zinc-500" aria-hidden>
        ~
      </span>
      <label className="flex min-w-0 flex-1 items-center gap-1.5 sm:max-w-56">
        <span className="sr-only">종료일</span>
        <CalendarDateField
          value={periodEnd}
          onChange={onPeriodEndChange}
          ariaLabel={`기간 종료일, ${dateFieldLabel} 기준`}
          placeholder="종료일"
          minYmd={periodStart || undefined}
          inputClassName={inputClass}
        />
      </label>
      {active ? (
        <button
          type="button"
          onClick={onClear}
          className={clearBtnClass}
        >
          <RotateCcw className="size-3.5 shrink-0" aria-hidden />
          기간 초기화
        </button>
      ) : null}
    </div>
  );
}
