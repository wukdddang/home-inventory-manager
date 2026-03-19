import type { Household } from "@/types/domain";

/**
 * 대시보드 거점 데이터 소스.
 * 백엔드 연결 시 Route Handler + fetch 구현체로 교체하면 된다.
 */
export type DashboardHouseholdsPort = {
  /** 예: GET /api/households */
  list(): Promise<Household[]>;
  /** 예: PUT /api/households (전체 스냅샷 저장) */
  saveAll(households: Household[]): Promise<void>;
};
