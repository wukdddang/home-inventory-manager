"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import type { SortColumn, SortPhase } from "../../_context/inventory-history-helpers.service";

function 헤더_열_필터_셀렉트({
  열이름,
  value,
  onChange,
  options,
  align = "left",
  className = "",
}: {
  열이름: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  align?: "left" | "right";
  className?: string;
}) {
  const 비어있음 = value === "";
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={`${열이름} 열 필터`}
      className={`box-border h-7 min-w-0 flex-1 cursor-pointer rounded border border-zinc-600/80 bg-zinc-950 px-1.5 py-0 text-xs outline-none focus:border-teal-500 ${
        align === "right" ? "text-right" : "text-left"
      } ${비어있음 ? "text-zinc-300" : "text-zinc-200"} ${className}`.trim()}
    >
      <option value="">{열이름}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function 헤더_정렬_호버_버튼({
  column,
  label,
  sortPhase,
  onSort,
}: {
  column: SortColumn;
  label: string;
  sortPhase: SortPhase;
  onSort: (c: SortColumn) => void;
}) {
  const active = sortPhase.scope === "column" && sortPhase.column === column;
  const sortDir = active ? sortPhase.dir : "asc";
  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className={`inline-flex shrink-0 items-center justify-center rounded p-0.5 transition-opacity focus-visible:outline focus-visible:ring-2 focus-visible:ring-teal-500/50 ${
        active
          ? "text-teal-400 opacity-100"
          : "text-zinc-300 opacity-0 group-hover:opacity-100"
      }`}
      aria-label={
        active
          ? `${label} 정렬, ${sortDir === "asc" ? "오름차순" : "내림차순"} 적용`
          : `${label} 정렬`
      }
    >
      {active ? (
        sortDir === "asc" ? (
          <ArrowUp className="size-3.5" aria-hidden />
        ) : (
          <ArrowDown className="size-3.5" aria-hidden />
        )
      ) : (
        <ArrowUp className="size-3.5 text-zinc-300" aria-hidden />
      )}
    </button>
  );
}

export function LedgerSortFilterHeader({
  column,
  label,
  sortPhase,
  onSort,
  align = "left",
  thClassName = "",
  filter,
}: {
  column: SortColumn;
  label: string;
  sortPhase: SortPhase;
  onSort: (c: SortColumn) => void;
  align?: "left" | "right";
  thClassName?: string;
  filter?: {
    value: string;
    options: string[];
    onChange: (v: string) => void;
  };
}) {
  const rowClass =
    align === "right"
      ? "group flex min-w-0 items-center justify-end gap-1"
      : "group flex min-w-0 items-center gap-1";
  return (
    <th
      scope="col"
      className={`sticky top-0 z-10 border-b border-zinc-700 bg-zinc-900 px-2 py-1 align-middle text-xs font-semibold tracking-wide ${thClassName}`.trim()}
    >
      <div className={rowClass}>
        {filter ? (
          <헤더_열_필터_셀렉트
            열이름={label}
            value={filter.value}
            onChange={filter.onChange}
            options={filter.options}
            align={align}
          />
        ) : (
          <span
            className={`min-w-0 flex-1 truncate text-zinc-300 ${
              align === "right" ? "text-right" : "text-left"
            }`}
          >
            {label}
          </span>
        )}
        <헤더_정렬_호버_버튼
          column={column}
          label={label}
          sortPhase={sortPhase}
          onSort={onSort}
        />
      </div>
    </th>
  );
}
