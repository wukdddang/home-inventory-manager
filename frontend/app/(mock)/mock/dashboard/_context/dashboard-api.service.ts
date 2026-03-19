import { getHouseholds, setHouseholds } from "@/lib/local-store";
import type { DashboardHouseholdsPort } from "./dashboard-households.port";

/**
 * `/dashboard` 등 실제 경로에서 쓰는 데이터 클라이언트.
 * 백엔드·Route Handler 연동 후 이 파일의 구현을 fetch 기반으로 교체하면 된다.
 * (현재: `him-households` localStorage)
 */
export const dashboardApiHouseholdsClient: DashboardHouseholdsPort = {
  async list() {
    return getHouseholds();
  },

  async saveAll(households) {
    setHouseholds(households);
  },
};
