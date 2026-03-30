/**
 * mock 경로 호환용 re-export.
 * DashboardProvider와 관련 타입은 (current)/dashboard/_context에서 관리합니다.
 */
export {
  DashboardProvider,
  DashboardContext,
  type DashboardContextType,
  type DashboardHouseholdsDataMode,
  type DashboardProviderProps,
} from "@/app/(current)/dashboard/_context/DashboardContext";
