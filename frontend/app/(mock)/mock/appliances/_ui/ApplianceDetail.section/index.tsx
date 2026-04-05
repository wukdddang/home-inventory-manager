"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Box,
  Plus,
  Pencil,
  Calendar,
  Wrench,
} from "lucide-react";
import { useAppliances } from "../../_hooks/useAppliances";
import type {
  Appliance,
  MaintenanceLogType,
  MaintenanceRepeatRule,
  MaintenanceSchedule,
} from "@/types/domain";
import type { MaintenanceLogTypeFilter } from "@/app/(current)/appliances/_context/AppliancesContext";

const REPEAT_RULE_OPTIONS: { value: MaintenanceRepeatRule; label: string }[] = [
  { value: "monthly", label: "매월" },
  { value: "quarterly", label: "분기" },
  { value: "semiannual", label: "반기" },
  { value: "annual", label: "매년" },
];

const LOG_TYPE_OPTIONS: { value: MaintenanceLogType; label: string }[] = [
  { value: "scheduled", label: "정기" },
  { value: "repair", label: "수리" },
  { value: "inspection", label: "점검" },
];

const LOG_TYPE_FILTER_OPTIONS: {
  value: MaintenanceLogTypeFilter;
  label: string;
}[] = [{ value: "all", label: "전체" }, ...LOG_TYPE_OPTIONS];

/* ── 가전 정보 수정 폼 ── */

function ApplianceEditForm({
  appliance,
  onClose,
}: {
  appliance: Appliance;
  onClose: () => void;
}) {
  const { 가전을_수정한다, households } = useAppliances();
  const [name, setName] = useState(appliance.name);
  const [brand, setBrand] = useState(appliance.brand ?? "");
  const [modelName, setModelName] = useState(appliance.modelName ?? "");
  const [roomId, setRoomId] = useState(appliance.roomId ?? "");

  const hh = households.find((h) => h.id === appliance.householdId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    가전을_수정한다({
      ...appliance,
      name: name.trim(),
      brand: brand.trim() || undefined,
      modelName: modelName.trim() || undefined,
      roomId: roomId || undefined,
    });
    onClose();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4"
      data-testid="appliance-edit-form"
    >
      <h3 className="mb-3 text-sm font-semibold text-zinc-200">정보 수정</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400">이름</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-teal-500"
            required
            data-testid="edit-name-input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400">브랜드</span>
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-teal-500"
            data-testid="edit-brand-input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400">모델명</span>
          <input
            type="text"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-teal-500"
            data-testid="edit-model-input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400">설치 위치</span>
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-teal-500"
            data-testid="edit-room-select"
          >
            <option value="">선택 안 함</option>
            {(hh?.rooms ?? []).map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500"
          data-testid="edit-submit"
        >
          저장
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
        >
          취소
        </button>
      </div>
    </form>
  );
}

/* ── 유지보수 스케줄 등록 폼 ── */

function ScheduleAddForm({
  applianceId,
  onClose,
}: {
  applianceId: string;
  onClose: () => void;
}) {
  const { 스케줄을_등록한다 } = useAppliances();
  const [taskName, setTaskName] = useState("");
  const [repeatRule, setRepeatRule] = useState<MaintenanceRepeatRule>("monthly");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;
    스케줄을_등록한다({
      applianceId,
      taskName: taskName.trim(),
      repeatRule,
      startDate,
      nextDueDate: startDate,
      isActive: true,
    });
    onClose();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4"
      data-testid="schedule-add-form"
    >
      <h3 className="mb-3 text-sm font-semibold text-zinc-200">
        유지보수 스케줄 등록
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400">작업명 *</span>
          <input
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="예: 필터 교체"
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-teal-500"
            required
            data-testid="schedule-task-input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400">반복 규칙</span>
          <select
            value={repeatRule}
            onChange={(e) =>
              setRepeatRule(e.target.value as MaintenanceRepeatRule)
            }
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-teal-500"
            data-testid="schedule-rule-select"
          >
            {REPEAT_RULE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400">시작일</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-teal-500"
            data-testid="schedule-start-input"
          />
        </label>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500"
          data-testid="schedule-add-submit"
        >
          등록
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
        >
          취소
        </button>
      </div>
    </form>
  );
}

/* ── 유지보수 이력 기록 폼 ── */

function LogAddForm({
  applianceId,
  schedules: appSchedules,
  onClose,
}: {
  applianceId: string;
  schedules: MaintenanceSchedule[];
  onClose: () => void;
}) {
  const { 이력을_기록한다 } = useAppliances();
  const [type, setType] = useState<MaintenanceLogType>("scheduled");
  const [description, setDescription] = useState("");
  const [scheduleId, setScheduleId] = useState(
    appSchedules.find((s) => s.isActive)?.id ?? "",
  );
  const [providerName, setProviderName] = useState("");
  const [cost, setCost] = useState("");
  const [completedOn, setCompletedOn] = useState(
    new Date().toISOString().slice(0, 10),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    이력을_기록한다({
      applianceId,
      type,
      description: description.trim(),
      scheduleId: type === "scheduled" && scheduleId ? scheduleId : undefined,
      providerName:
        type === "repair" && providerName.trim()
          ? providerName.trim()
          : undefined,
      cost: type === "repair" && cost ? Number(cost) : undefined,
      completedOn,
    });
    onClose();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4"
      data-testid="log-add-form"
    >
      <h3 className="mb-3 text-sm font-semibold text-zinc-200">이력 기록</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400">유형</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as MaintenanceLogType)}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-teal-500"
            data-testid="log-type-select"
          >
            {LOG_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        {type === "scheduled" && appSchedules.length > 0 && (
          <label className="flex flex-col gap-1">
            <span className="text-xs text-zinc-400">스케줄 연결</span>
            <select
              value={scheduleId}
              onChange={(e) => setScheduleId(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-teal-500"
              data-testid="log-schedule-select"
            >
              <option value="">선택 안 함</option>
              {appSchedules
                .filter((s) => s.isActive)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.taskName}
                  </option>
                ))}
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs text-zinc-400">설명 *</span>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="예: 통세척 완료"
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-teal-500"
            required
            data-testid="log-desc-input"
          />
        </label>
        {type === "repair" && (
          <>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-zinc-400">업체명</span>
              <input
                type="text"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-teal-500"
                data-testid="log-provider-input"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-zinc-400">비용 (원)</span>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-teal-500"
                data-testid="log-cost-input"
              />
            </label>
          </>
        )}
        <label className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400">완료일</span>
          <input
            type="date"
            value={completedOn}
            onChange={(e) => setCompletedOn(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-teal-500"
            data-testid="log-date-input"
          />
        </label>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500"
          data-testid="log-add-submit"
        >
          기록
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
        >
          취소
        </button>
      </div>
    </form>
  );
}

/* ── 스케줄 수정 인라인 ── */

function ScheduleEditRow({
  schedule,
  onClose,
}: {
  schedule: MaintenanceSchedule;
  onClose: () => void;
}) {
  const { 스케줄을_수정한다 } = useAppliances();
  const [taskName, setTaskName] = useState(schedule.taskName);
  const [repeatRule, setRepeatRule] = useState(schedule.repeatRule);
  const [nextDueDate, setNextDueDate] = useState(schedule.nextDueDate);

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg border border-zinc-700 bg-zinc-800/60 p-2" data-testid="schedule-edit-row">
      <input
        type="text"
        value={taskName}
        onChange={(e) => setTaskName(e.target.value)}
        className="w-32 rounded border border-zinc-600 bg-zinc-900 px-2 py-1 text-xs text-zinc-100"
        data-testid="schedule-edit-task"
      />
      <select
        value={repeatRule}
        onChange={(e) =>
          setRepeatRule(e.target.value as MaintenanceRepeatRule)
        }
        className="rounded border border-zinc-600 bg-zinc-900 px-2 py-1 text-xs text-zinc-100"
        data-testid="schedule-edit-rule"
      >
        {REPEAT_RULE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <input
        type="date"
        value={nextDueDate}
        onChange={(e) => setNextDueDate(e.target.value)}
        className="rounded border border-zinc-600 bg-zinc-900 px-2 py-1 text-xs text-zinc-100"
        data-testid="schedule-edit-date"
      />
      <button
        onClick={() => {
          스케줄을_수정한다({
            ...schedule,
            taskName: taskName.trim(),
            repeatRule,
            nextDueDate,
          });
          onClose();
        }}
        className="rounded bg-teal-600 px-2 py-1 text-xs text-white hover:bg-teal-500"
        data-testid="schedule-edit-save"
      >
        저장
      </button>
      <button
        onClick={onClose}
        className="rounded border border-zinc-600 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200"
      >
        취소
      </button>
    </div>
  );
}

/* ── 메인 상세 섹션 ── */

export function ApplianceDetailSection() {
  const {
    selectedAppliance,
    가전을_선택한다,
    schedules,
    logs,
    logTypeFilter,
    이력_유형_필터를_변경한다,
    스케줄을_수정한다,
    households,
  } = useAppliances();

  const [showEdit, setShowEdit] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(
    null,
  );

  if (!selectedAppliance) return null;

  const appSchedules = schedules.filter(
    (s) => s.applianceId === selectedAppliance.id,
  );
  const appLogs = logs
    .filter((l) => l.applianceId === selectedAppliance.id)
    .filter((l) => logTypeFilter === "all" || l.type === logTypeFilter)
    .sort(
      (a, b) =>
        new Date(b.completedOn).getTime() - new Date(a.completedOn).getTime(),
    );

  const hh = households.find((h) => h.id === selectedAppliance.householdId);
  const roomName = selectedAppliance.roomId
    ? hh?.rooms.find((r) => r.id === selectedAppliance.roomId)?.name
    : undefined;

  const isDisposed = selectedAppliance.status === "disposed";

  return (
    <div className="flex flex-col gap-5" data-testid="appliance-detail">
      {/* 뒤로 가기 */}
      <button
        onClick={() => 가전을_선택한다(null)}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200"
        data-testid="back-to-list"
      >
        <ArrowLeft className="size-4" />
        목록으로
      </button>

      {/* 기본 정보 */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100" data-testid="detail-name">
              {selectedAppliance.name}
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              {[selectedAppliance.brand, selectedAppliance.modelName]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          {!isDisposed && (
            <button
              onClick={() => setShowEdit((p) => !p)}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
              data-testid="edit-btn"
            >
              <Pencil className="size-3" />
              수정
            </button>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <div>
            <span className="text-zinc-500">상태</span>
            <p className={isDisposed ? "text-rose-400" : "text-teal-400"} data-testid="detail-status">
              {isDisposed ? "폐기" : "활성"}
            </p>
          </div>
          {selectedAppliance.purchasedOn && (
            <div>
              <span className="text-zinc-500">구매일</span>
              <p className="text-zinc-200">{selectedAppliance.purchasedOn}</p>
            </div>
          )}
          {selectedAppliance.warrantyExpiresOn && (
            <div>
              <span className="text-zinc-500">보증 만료</span>
              <p className="text-zinc-200" data-testid="detail-warranty">
                {selectedAppliance.warrantyExpiresOn}
              </p>
            </div>
          )}
          {roomName && (
            <div>
              <span className="text-zinc-500">설치 위치</span>
              <p className="text-zinc-200">{roomName}</p>
            </div>
          )}
        </div>
      </div>

      {/* 수정 폼 */}
      {showEdit && (
        <ApplianceEditForm
          appliance={selectedAppliance}
          onClose={() => setShowEdit(false)}
        />
      )}

      {/* v2.8: 하위 보관 장소 및 재고 */}
      {hh && (() => {
        const appSlots = (hh.storageLocations ?? []).filter(
          (s) => s.applianceId === selectedAppliance.id,
        );
        const allItems = hh.items ?? [];
        const appSlotIds = new Set(appSlots.map((s) => s.id));
        const appItems = allItems.filter(
          (it) => it.storageLocationId && appSlotIds.has(it.storageLocationId),
        );

        return (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4" data-testid="appliance-storage-section">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-200">
                <Box className="mr-1.5 inline size-4 text-zinc-400" />
                보관 장소 · 물품
              </h3>
              <span className="text-xs text-zinc-500">
                {appSlots.length}개 보관 장소 · {appItems.length}개 물품
              </span>
            </div>

            {appSlots.length === 0 ? (
              <p className="text-xs text-zinc-500" data-testid="no-appliance-storage">
                등록된 보관 장소가 없습니다. 대시보드에서 이 가전에 보관 장소를 추가하세요.
              </p>
            ) : (
              <div className="flex flex-col gap-2" data-testid="appliance-storage-list">
                {appSlots
                  .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                  .map((slot) => {
                    const slotItems = appItems.filter(
                      (it) => it.storageLocationId === slot.id,
                    );
                    return (
                      <div
                        key={slot.id}
                        className="rounded-lg border border-zinc-800 px-3 py-2"
                        data-testid={`appliance-slot-${slot.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-zinc-200">
                            {slot.name}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {slotItems.length}개 물품
                          </span>
                        </div>
                        {slotItems.length > 0 && (
                          <ul className="mt-1.5 space-y-1">
                            {slotItems.map((item) => (
                              <li
                                key={item.id}
                                className="flex items-center justify-between text-xs"
                                data-testid={`appliance-item-${item.id}`}
                              >
                                <span className="text-zinc-300">{item.name}</span>
                                <span className="text-zinc-500">
                                  {item.quantity} {item.unit}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        );
      })()}

      {/* 유지보수 스케줄 */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-200">
            <Calendar className="mr-1.5 inline size-4 text-zinc-400" />
            유지보수 스케줄
          </h3>
          {!isDisposed && (
            <button
              onClick={() => setShowScheduleForm((p) => !p)}
              className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-2.5 py-1 text-xs text-white hover:bg-teal-500"
              data-testid="add-schedule-btn"
            >
              <Plus className="size-3" />
              추가
            </button>
          )}
        </div>

        {/* 폐기된 가전에 스케줄 추가 시도 시 오류 */}
        {isDisposed && showScheduleForm && (
          <p className="mb-2 text-xs text-rose-400" data-testid="disposed-schedule-error">
            폐기된 가전에는 유지보수 스케줄을 추가할 수 없습니다.
          </p>
        )}

        {showScheduleForm && !isDisposed && (
          <div className="mb-3">
            <ScheduleAddForm
              applianceId={selectedAppliance.id}
              onClose={() => setShowScheduleForm(false)}
            />
          </div>
        )}

        {appSchedules.length === 0 ? (
          <p className="text-xs text-zinc-500">등록된 스케줄이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-2" data-testid="schedule-list">
            {appSchedules.map((sch) =>
              editingScheduleId === sch.id ? (
                <ScheduleEditRow
                  key={sch.id}
                  schedule={sch}
                  onClose={() => setEditingScheduleId(null)}
                />
              ) : (
                <div
                  key={sch.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 px-3 py-2"
                  data-testid={`schedule-item-${sch.id}`}
                >
                  <div className="min-w-0">
                    <span
                      className={`text-sm font-medium ${sch.isActive ? "text-zinc-200" : "text-zinc-500 line-through"}`}
                      data-testid="schedule-task-name"
                    >
                      {sch.taskName}
                    </span>
                    <span className="ml-2 text-xs text-zinc-500">
                      {
                        REPEAT_RULE_OPTIONS.find(
                          (o) => o.value === sch.repeatRule,
                        )?.label
                      }
                    </span>
                    <span className="ml-2 text-xs text-zinc-400" data-testid="schedule-next-due">
                      다음: {sch.nextDueDate}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {sch.isActive && (
                      <button
                        onClick={() =>
                          스케줄을_수정한다({ ...sch, isActive: false })
                        }
                        className="rounded px-2 py-0.5 text-xs text-amber-400 hover:bg-zinc-800"
                        data-testid={`deactivate-schedule-${sch.id}`}
                      >
                        비활성화
                      </button>
                    )}
                    <button
                      onClick={() => setEditingScheduleId(sch.id)}
                      className="rounded px-2 py-0.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                      data-testid={`edit-schedule-${sch.id}`}
                    >
                      <Pencil className="size-3" />
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>

      {/* 유지보수 이력 */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-200">
            <Wrench className="mr-1.5 inline size-4 text-zinc-400" />
            유지보수·A/S 이력
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-zinc-700 p-0.5" data-testid="log-type-filter">
              {LOG_TYPE_FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => 이력_유형_필터를_변경한다(opt.value)}
                  className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                    logTypeFilter === opt.value
                      ? "bg-teal-500/15 text-teal-300"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                  data-testid={`log-filter-${opt.value}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowLogForm((p) => !p)}
              className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-2.5 py-1 text-xs text-white hover:bg-teal-500"
              data-testid="add-log-btn"
            >
              <Plus className="size-3" />
              기록
            </button>
          </div>
        </div>

        {showLogForm && (
          <div className="mb-3">
            <LogAddForm
              applianceId={selectedAppliance.id}
              schedules={appSchedules}
              onClose={() => setShowLogForm(false)}
            />
          </div>
        )}

        {appLogs.length === 0 ? (
          <p className="text-xs text-zinc-500">기록된 이력이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-2" data-testid="log-list">
            {appLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-lg border border-zinc-800 px-3 py-2"
                data-testid={`log-item-${log.id}`}
              >
                <div className="min-w-0">
                  <span
                    className={`mr-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      log.type === "scheduled"
                        ? "bg-teal-500/15 text-teal-400"
                        : log.type === "repair"
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-blue-500/15 text-blue-400"
                    }`}
                    data-testid="log-type-badge"
                  >
                    {LOG_TYPE_OPTIONS.find((o) => o.value === log.type)?.label}
                  </span>
                  <span className="text-sm text-zinc-200">
                    {log.description}
                  </span>
                  {log.providerName && (
                    <span className="ml-2 text-xs text-zinc-400">
                      {log.providerName}
                    </span>
                  )}
                  {log.cost != null && (
                    <span className="ml-2 text-xs text-zinc-400">
                      ₩{log.cost.toLocaleString()}
                    </span>
                  )}
                </div>
                <span className="shrink-0 text-xs text-zinc-500">
                  {log.completedOn}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
