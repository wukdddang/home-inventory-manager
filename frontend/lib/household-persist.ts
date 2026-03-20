import type { Household } from "@/types/domain";

/** 저장·전송 시 레거시 catalog 필드 제거 (상품 마스터는 공통 카탈로그 키에만 둔다) */
export function stripHouseholdCatalogForPersist(h: Household): Household {
  const x = { ...h } as Record<string, unknown>;
  delete x.catalog;
  return x as Household;
}
