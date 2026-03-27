import type { Household } from "@/types/domain";

/**
 * v2.1 이후 카탈로그는 거점에 귀속되므로 catalog 필드를 보존한다.
 * 호출처 호환을 위해 함수 시그니처는 유지(패스스루).
 */
export function stripHouseholdCatalogForPersist(h: Household): Household {
  return h;
}
