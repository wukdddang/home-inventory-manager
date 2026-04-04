import type {
  Appliance,
  MaintenanceSchedule,
  MaintenanceLog,
} from "@/types/domain";

/* ── 목 시드 데이터 ── */

function 날짜에_일수를_더한다(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function 날짜를_YMD_문자열로_한다(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function mock가전_시드를_생성한다(): Appliance[] {
  const now = new Date();
  return [
    {
      id: "mock-appliance-washer",
      householdId: "mock-household-home",
      name: "드럼세탁기",
      brand: "LG",
      modelName: "FX24KN",
      purchasedOn: 날짜를_YMD_문자열로_한다(
        날짜에_일수를_더한다(now, -365),
      ),
      warrantyExpiresOn: 날짜를_YMD_문자열로_한다(
        날짜에_일수를_더한다(now, 365),
      ),
      roomId: "mock-room-storage",
      status: "active",
      createdAt: 날짜를_YMD_문자열로_한다(날짜에_일수를_더한다(now, -365)),
    },
    {
      id: "mock-appliance-fridge",
      householdId: "mock-household-home",
      name: "양문형 냉장고",
      brand: "Samsung",
      modelName: "RS84T5061B4",
      purchasedOn: 날짜를_YMD_문자열로_한다(
        날짜에_일수를_더한다(now, -730),
      ),
      warrantyExpiresOn: 날짜를_YMD_문자열로_한다(
        날짜에_일수를_더한다(now, -30),
      ),
      roomId: "mock-room-kitchen",
      /** v2.8: 냉장고 가구(FP)와 같은 방에 배치 */
      status: "active",
      createdAt: 날짜를_YMD_문자열로_한다(날짜에_일수를_더한다(now, -730)),
    },
    {
      id: "mock-appliance-ac-disposed",
      householdId: "mock-household-home",
      name: "벽걸이 에어컨",
      brand: "LG",
      modelName: "SQ06BDAWAS",
      purchasedOn: 날짜를_YMD_문자열로_한다(
        날짜에_일수를_더한다(now, -1460),
      ),
      warrantyExpiresOn: 날짜를_YMD_문자열로_한다(
        날짜에_일수를_더한다(now, -730),
      ),
      roomId: "mock-room-living",
      status: "disposed",
      disposedOn: 날짜를_YMD_문자열로_한다(날짜에_일수를_더한다(now, -60)),
      createdAt: 날짜를_YMD_문자열로_한다(날짜에_일수를_더한다(now, -1460)),
    },
    {
      id: "mock-appliance-airpurifier",
      householdId: "mock-household-home",
      name: "공기청정기",
      brand: "Coway",
      modelName: "AP-1516D",
      purchasedOn: 날짜를_YMD_문자열로_한다(
        날짜에_일수를_더한다(now, -200),
      ),
      warrantyExpiresOn: 날짜를_YMD_문자열로_한다(
        날짜에_일수를_더한다(now, 530),
      ),
      roomId: "mock-room-living",
      status: "active",
      createdAt: 날짜를_YMD_문자열로_한다(날짜에_일수를_더한다(now, -200)),
    },
  ];
}

export function mock유지보수_스케줄_시드를_생성한다(): MaintenanceSchedule[] {
  const now = new Date();
  return [
    {
      id: "mock-maint-sch-washer-clean",
      applianceId: "mock-appliance-washer",
      taskName: "통세척",
      repeatRule: "monthly",
      startDate: 날짜를_YMD_문자열로_한다(날짜에_일수를_더한다(now, -30)),
      nextDueDate: 날짜를_YMD_문자열로_한다(날짜에_일수를_더한다(now, 0)),
      isActive: true,
    },
    {
      id: "mock-maint-sch-fridge-defrost",
      applianceId: "mock-appliance-fridge",
      taskName: "성에 제거",
      repeatRule: "quarterly",
      startDate: 날짜를_YMD_문자열로_한다(날짜에_일수를_더한다(now, -90)),
      nextDueDate: 날짜를_YMD_문자열로_한다(날짜에_일수를_더한다(now, 0)),
      isActive: true,
    },
    {
      id: "mock-maint-sch-air-filter",
      applianceId: "mock-appliance-airpurifier",
      taskName: "필터 교체",
      repeatRule: "semiannual",
      startDate: 날짜를_YMD_문자열로_한다(날짜에_일수를_더한다(now, -180)),
      nextDueDate: 날짜를_YMD_문자열로_한다(날짜에_일수를_더한다(now, 3)),
      isActive: true,
    },
  ];
}

export function mock유지보수_이력_시드를_생성한다(): MaintenanceLog[] {
  const now = new Date();
  return [
    {
      id: "mock-maint-log-1",
      applianceId: "mock-appliance-washer",
      scheduleId: "mock-maint-sch-washer-clean",
      type: "scheduled",
      description: "통세척 완료",
      completedOn: 날짜를_YMD_문자열로_한다(날짜에_일수를_더한다(now, -30)),
      createdAt: 날짜를_YMD_문자열로_한다(날짜에_일수를_더한다(now, -30)),
    },
    {
      id: "mock-maint-log-2",
      applianceId: "mock-appliance-fridge",
      type: "repair",
      description: "냉각 불량 수리",
      providerName: "삼성 서비스센터",
      cost: 150000,
      completedOn: 날짜를_YMD_문자열로_한다(날짜에_일수를_더한다(now, -45)),
      createdAt: 날짜를_YMD_문자열로_한다(날짜에_일수를_더한다(now, -45)),
    },
    {
      id: "mock-maint-log-3",
      applianceId: "mock-appliance-airpurifier",
      type: "inspection",
      description: "필터 상태 점검",
      completedOn: 날짜를_YMD_문자열로_한다(날짜에_일수를_더한다(now, -10)),
      createdAt: 날짜를_YMD_문자열로_한다(날짜에_일수를_더한다(now, -10)),
    },
  ];
}

/* ── 목 세션 스토어: 가전 ── */

let applianceCache: Appliance[] | null = null;
const applianceListeners = new Set<() => void>();

function ensureApplianceCache(): Appliance[] {
  if (applianceCache === null) {
    applianceCache = mock가전_시드를_생성한다();
  }
  return applianceCache;
}

function emitAppliances() {
  applianceListeners.forEach((fn) => fn());
}

export function getMockAppliancesSession(): Appliance[] {
  return ensureApplianceCache();
}

export function setMockAppliancesSession(next: Appliance[]) {
  applianceCache = [...next];
  emitAppliances();
}

export function updateMockAppliancesSession(
  updater: (prev: Appliance[]) => Appliance[],
) {
  const prev = [...ensureApplianceCache()];
  setMockAppliancesSession(updater(prev));
}

export function subscribeMockAppliancesSession(onStoreChange: () => void) {
  applianceListeners.add(onStoreChange);
  return () => {
    applianceListeners.delete(onStoreChange);
  };
}

/* ── 목 세션 스토어: 유지보수 스케줄 ── */

let scheduleCache: MaintenanceSchedule[] | null = null;
const scheduleListeners = new Set<() => void>();

function ensureScheduleCache(): MaintenanceSchedule[] {
  if (scheduleCache === null) {
    scheduleCache = mock유지보수_스케줄_시드를_생성한다();
  }
  return scheduleCache;
}

function emitSchedules() {
  scheduleListeners.forEach((fn) => fn());
}

export function getMockSchedulesSession(): MaintenanceSchedule[] {
  return ensureScheduleCache();
}

export function setMockSchedulesSession(next: MaintenanceSchedule[]) {
  scheduleCache = [...next];
  emitSchedules();
}

export function updateMockSchedulesSession(
  updater: (prev: MaintenanceSchedule[]) => MaintenanceSchedule[],
) {
  const prev = [...ensureScheduleCache()];
  setMockSchedulesSession(updater(prev));
}

export function subscribeMockSchedulesSession(onStoreChange: () => void) {
  scheduleListeners.add(onStoreChange);
  return () => {
    scheduleListeners.delete(onStoreChange);
  };
}

/* ── 목 세션 스토어: 유지보수 이력 ── */

let logCache: MaintenanceLog[] | null = null;
const logListeners = new Set<() => void>();

function ensureLogCache(): MaintenanceLog[] {
  if (logCache === null) {
    logCache = mock유지보수_이력_시드를_생성한다();
  }
  return logCache;
}

function emitLogs() {
  logListeners.forEach((fn) => fn());
}

export function getMockLogsSession(): MaintenanceLog[] {
  return ensureLogCache();
}

export function setMockLogsSession(next: MaintenanceLog[]) {
  logCache = [...next];
  emitLogs();
}

export function updateMockLogsSession(
  updater: (prev: MaintenanceLog[]) => MaintenanceLog[],
) {
  const prev = [...ensureLogCache()];
  setMockLogsSession(updater(prev));
}

export function subscribeMockLogsSession(onStoreChange: () => void) {
  logListeners.add(onStoreChange);
  return () => {
    logListeners.delete(onStoreChange);
  };
}
