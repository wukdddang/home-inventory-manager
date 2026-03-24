"use client";

import {
  appViewPresenceTransition,
  appViewPresenceVariants,
} from "@/app/_ui/app-view-transition.motion";
import { FormModal } from "@/app/_ui/form-modal";
import { PeriodFilterToolbar } from "@/app/_ui/table-period-filter-row";
import { useAppRoutePrefix } from "@/lib/use-app-route-prefix";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import Link from "next/link";
import { useInventoryHistory } from "../../_hooks/useInventoryHistory";
import {
  LEDGER_PAGE_SIZE,
  LEDGER_TABLE_COL_COUNT,
  행_메모_문자열을_구한다,
  폐기_사유_라벨을_구한다,
} from "../../_lib/inventory-history-helpers";
import { LedgerLegend } from "../LedgerLegend.component";
import { LedgerPagination } from "../LedgerPagination.component";
import { LedgerSortFilterHeader } from "../LedgerTableHeader.component";
import { LedgerTableRow } from "../LedgerTableRow.component";

export function InventoryHistoryPanel() {
  const prefix = useAppRoutePrefix();
  const ctx = useInventoryHistory();

  const {
    households,
    paginatedRows,
    totalBase,
    totalFiltered,
    totalPages,
    activePageIndex,
    hasFilterContext,
    hasActiveColumnFilters,
    hasActivePeriodFilter,
    periodFilteredRowsCount,
    columnFilteredRowsCount,
    footerRangeStart,
    footerRangeEnd,
    columnFilterOptions,
    sortPhase,
    memoOverrides,
    filterHouseholdId,
    searchQuery,
    columnFilters,
    periodStart,
    periodEnd,
    memoModalRow,
    memoDraft,
    거점_필터를_바꾼다,
    검색어를_바꾼다,
    컬럼_필터를_바꾼다,
    컬럼_필터를_초기화한다,
    기간_시작을_바꾼다,
    기간_종료를_바꾼다,
    기간을_초기화한다,
    정렬을_바꾼다,
    페이지를_바꾼다,
    이전_페이지로_간다,
    다음_페이지로_간다,
    비고_수정_모달을_연다,
    비고_모달을_닫는다,
    비고_모달_드래프트를_바꾼다,
    비고_모달에서_저장한다,
  } = ctx;

  return (
    <motion.div
      className="flex w-full min-w-0 max-w-none min-h-0 flex-1 flex-col gap-6 overflow-hidden"
      initial="initial"
      animate="animate"
      variants={appViewPresenceVariants}
      transition={appViewPresenceTransition}
    >
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold text-white">재고 이력</h1>
        <p className="mt-1 text-sm text-zinc-300">
          품목별 증감·잔여를 표로 확인합니다. 비고 텍스트를 누르면 모달에서
          편집할 수 있습니다. (mock 목 데이터·화면 전용)
        </p>
        <Link
          href={`${prefix}/dashboard`}
          className="mt-2 inline-block text-xs font-medium text-teal-400/90 hover:underline"
        >
          &larr; 메인(대시보드)으로
        </Link>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {/* ── 툴바 ── */}
        <div
          className="flex w-full min-w-0 shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-3"
          role="toolbar"
          aria-label="목록 필터 및 범례"
        >
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <select
              value={filterHouseholdId}
              onChange={(e) => 거점_필터를_바꾼다(e.target.value)}
              aria-label="표시 거점 범위"
              className={`box-border h-9 min-w-30 shrink-0 cursor-pointer rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-0 text-xs leading-none outline-none focus:border-teal-500 ${
                filterHouseholdId === "all" ? "text-zinc-300" : "text-zinc-100"
              }`}
            >
              <option value="all">거점</option>
              {households.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
            {totalBase > 0 && hasActiveColumnFilters ? (
              <button
                type="button"
                onClick={컬럼_필터를_초기화한다}
                className="shrink-0 whitespace-nowrap text-xs font-medium text-teal-400/90 hover:underline"
              >
                표 열 필터 초기화
              </button>
            ) : null}
            <PeriodFilterToolbar
              dateFieldLabel="일시(기록일)"
              periodStart={periodStart}
              periodEnd={periodEnd}
              onPeriodStartChange={기간_시작을_바꾼다}
              onPeriodEndChange={기간_종료를_바꾼다}
              onClear={기간을_초기화한다}
            />
            <div className="relative h-9 min-w-0 flex-1 basis-full sm:min-w-48 sm:basis-0">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-300"
                aria-hidden
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => 검색어를_바꾼다(e.target.value)}
                placeholder="검색 (거점·품목·구분·비고 등)"
                className={`box-border h-9 w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-950 py-0 pl-9 pr-3 text-sm leading-none outline-none placeholder:text-zinc-300 focus:border-teal-500 ${
                  searchQuery.trim() === "" ? "text-zinc-300" : "text-zinc-100"
                }`}
                autoComplete="off"
              />
            </div>
          </div>
          {totalBase > 0 ? (
            <div className="max-w-[min(100%,28rem)] shrink-0">
              <LedgerLegend />
            </div>
          ) : null}
        </div>

        {/* ── 테이블 or 빈 상태 ── */}
        {totalBase === 0 ? (
          <div className="flex min-h-0 flex-1 flex-col justify-center rounded-xl border border-dashed border-zinc-700 px-4 py-10">
            <p className="text-center text-sm text-zinc-300">
              아직 기록이 없습니다. 대시보드 물품 목록에서 소비·폐기를 남기면
              여기에 쌓입니다.
            </p>
            <p className="mt-6 text-right text-xs text-zinc-300">총 0행</p>
          </div>
        ) : (
          <>
            {totalFiltered === 0 ? (
              <div className="flex min-h-0 flex-1 flex-col justify-center rounded-xl border border-dashed border-zinc-700 px-4 py-10">
                <p className="text-center text-sm text-zinc-300">
                  {hasActivePeriodFilter &&
                  periodFilteredRowsCount === 0 &&
                  totalBase > 0
                    ? "기간 조건에 맞는 행이 없습니다."
                    : columnFilteredRowsCount === 0
                      ? "표 열 필터 조건에 맞는 행이 없습니다."
                      : "검색 조건에 맞는 행이 없습니다."}
                </p>
                <p className="mt-6 text-right text-xs text-zinc-300">
                  {hasFilterContext
                    ? `표시 ${totalFiltered} / 전체 ${totalBase}행`
                    : `총 ${totalFiltered}행`}
                </p>
              </div>
            ) : (
              <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950/80 shadow-inner ring-1 ring-zinc-800/80">
                <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-auto [scrollbar-width:thin]">
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <table className="w-full min-w-350 table-fixed border-collapse text-left text-sm">
                      <thead>
                        <tr className="bg-zinc-900">
                          <LedgerSortFilterHeader
                            column="createdAt"
                            label="일시"
                            sortPhase={sortPhase}
                            onSort={정렬을_바꾼다}
                            thClassName="w-[6%] whitespace-nowrap"
                          />
                          <LedgerSortFilterHeader
                            column="householdName"
                            label="거점"
                            sortPhase={sortPhase}
                            onSort={정렬을_바꾼다}
                            thClassName="w-[8%] min-w-[5rem]"
                            filter={{
                              value: columnFilters.householdName ?? "",
                              options: columnFilterOptions.householdName,
                              onChange: (v) =>
                                컬럼_필터를_바꾼다("householdName", v),
                            }}
                          />
                          <LedgerSortFilterHeader
                            column="roomName"
                            label="방"
                            sortPhase={sortPhase}
                            onSort={정렬을_바꾼다}
                            thClassName="w-[7%] min-w-[4rem]"
                            filter={{
                              value: columnFilters.roomName ?? "",
                              options: columnFilterOptions.roomName,
                              onChange: (v) =>
                                컬럼_필터를_바꾼다("roomName", v),
                            }}
                          />
                          <LedgerSortFilterHeader
                            column="placeLabel"
                            label="장소"
                            sortPhase={sortPhase}
                            onSort={정렬을_바꾼다}
                            thClassName="w-[8%] min-w-[5rem]"
                            filter={{
                              value: columnFilters.placeLabel ?? "",
                              options: columnFilterOptions.placeLabel,
                              onChange: (v) =>
                                컬럼_필터를_바꾼다("placeLabel", v),
                            }}
                          />
                          <LedgerSortFilterHeader
                            column="detailLabel"
                            label="세부장소"
                            sortPhase={sortPhase}
                            onSort={정렬을_바꾼다}
                            thClassName="w-[8%] min-w-[5rem]"
                            filter={{
                              value: columnFilters.detailLabel ?? "",
                              options: columnFilterOptions.detailLabel,
                              onChange: (v) =>
                                컬럼_필터를_바꾼다("detailLabel", v),
                            }}
                          />
                          <LedgerSortFilterHeader
                            column="category"
                            label="분류"
                            sortPhase={sortPhase}
                            onSort={정렬을_바꾼다}
                            thClassName="w-[8%]"
                            filter={{
                              value: columnFilters.category ?? "",
                              options: columnFilterOptions.category,
                              onChange: (v) =>
                                컬럼_필터를_바꾼다("category", v),
                            }}
                          />
                          <LedgerSortFilterHeader
                            column="itemName"
                            label="품목"
                            sortPhase={sortPhase}
                            onSort={정렬을_바꾼다}
                            thClassName="w-[9%]"
                            filter={{
                              value: columnFilters.itemName ?? "",
                              options: columnFilterOptions.itemName,
                              onChange: (v) =>
                                컬럼_필터를_바꾼다("itemName", v),
                            }}
                          />
                          <LedgerSortFilterHeader
                            column="spec"
                            label="규격"
                            sortPhase={sortPhase}
                            onSort={정렬을_바꾼다}
                            thClassName="w-[7%]"
                            filter={{
                              value: columnFilters.spec ?? "",
                              options: columnFilterOptions.spec,
                              onChange: (v) => 컬럼_필터를_바꾼다("spec", v),
                            }}
                          />
                          <LedgerSortFilterHeader
                            column="type"
                            label="구분"
                            sortPhase={sortPhase}
                            onSort={정렬을_바꾼다}
                            thClassName="w-[5%] whitespace-nowrap"
                            filter={{
                              value: columnFilters.type ?? "",
                              options: columnFilterOptions.type,
                              onChange: (v) => 컬럼_필터를_바꾼다("type", v),
                            }}
                          />
                          <LedgerSortFilterHeader
                            column="wasteReason"
                            label="폐기 사유"
                            sortPhase={sortPhase}
                            onSort={정렬을_바꾼다}
                            thClassName="w-[8%]"
                          />
                          <LedgerSortFilterHeader
                            column="delta"
                            label="증감"
                            sortPhase={sortPhase}
                            onSort={정렬을_바꾼다}
                            align="right"
                            thClassName="w-[6%] whitespace-nowrap"
                          />
                          <LedgerSortFilterHeader
                            column="balance"
                            label="잔여 수량"
                            sortPhase={sortPhase}
                            onSort={정렬을_바꾼다}
                            align="right"
                            thClassName="w-[5%] whitespace-nowrap"
                          />
                          <LedgerSortFilterHeader
                            column="note"
                            label="비고(수정 가능)"
                            sortPhase={sortPhase}
                            onSort={정렬을_바꾼다}
                            thClassName="min-w-0"
                          />
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedRows.map((row, idx) => (
                          <LedgerTableRow
                            key={row.id}
                            row={row}
                            households={households}
                            zebra={idx % 2 === 1}
                            memoValue={행_메모_문자열을_구한다(
                              row,
                              memoOverrides,
                            )}
                            onEditMemo={() => 비고_수정_모달을_연다(row)}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <table
                    className="w-full min-w-350 table-fixed border-collapse border-t border-zinc-800 bg-zinc-900/95 text-left text-sm"
                    aria-label="재고 이력 표 요약"
                  >
                    <tfoot>
                      <tr>
                        <td
                          colSpan={LEDGER_TABLE_COL_COUNT}
                          className="px-3 py-2.5 align-middle"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="min-w-0 text-left text-xs leading-relaxed text-zinc-300">
                              {totalFiltered === 0 ? (
                                "표시할 행 없음"
                              ) : (
                                <>
                                  <span className="font-medium text-zinc-300">
                                    {footerRangeStart}–{footerRangeEnd}번째
                                  </span>
                                  <span className="text-zinc-300">
                                    {" "}
                                    / 이번 목록 {totalFiltered}행
                                  </span>
                                  {hasFilterContext ? (
                                    <span className="text-zinc-300">
                                      {" "}
                                      (거점·기간·검색·표 열 필터 적용 전{" "}
                                      {totalBase}행)
                                    </span>
                                  ) : (
                                    <span className="text-zinc-300">
                                      {" "}
                                      · 페이지당 {LEDGER_PAGE_SIZE}행
                                    </span>
                                  )}
                                </>
                              )}
                            </p>
                            <LedgerPagination
                              pageIndex={activePageIndex}
                              totalPages={totalPages}
                              onPrev={이전_페이지로_간다}
                              onNext={다음_페이지로_간다}
                              onGoToPage={페이지를_바꾼다}
                            />
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── 비고 수정 모달 ── */}
      <FormModal
        open={memoModalRow !== null}
        onOpenChange={(open) => {
          if (!open) 비고_모달을_닫는다();
        }}
        title="비고 수정"
        description={
          memoModalRow
            ? (memoModalRow.itemLabel ?? memoModalRow.inventoryItemId)
            : undefined
        }
        onSubmit={비고_모달에서_저장한다}
        submitLabel="저장"
      >
        {memoModalRow?.type === "waste" && memoModalRow.reason ? (
          <p className="mb-4 text-sm text-zinc-300">
            폐기 사유:{" "}
            <span className="text-zinc-200">
              {폐기_사유_라벨을_구한다(memoModalRow.reason)}
            </span>
          </p>
        ) : null}
        <label
          htmlFor="ledger-memo-draft"
          className="text-xs font-medium text-zinc-300"
        >
          메모
        </label>
        <textarea
          id="ledger-memo-draft"
          value={memoDraft}
          onChange={(e) => 비고_모달_드래프트를_바꾼다(e.target.value)}
          rows={5}
          placeholder="메모를 입력하세요"
          className="mt-1.5 w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-300 outline-none focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500/30"
        />
      </FormModal>
    </motion.div>
  );
}
