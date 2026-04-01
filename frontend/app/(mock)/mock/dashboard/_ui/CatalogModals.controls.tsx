"use client";

/**
 * `/dashboard` 경로 전용 진입점 — 구현은 앱 공통 `@/app/_ui`에 둡니다.
 * `/mock/dashboard`·설정 화면에서도 동일 모듈을 가져다 씁니다.
 */
export {
  CatalogModalsControls,
  type CatalogModalsControlsProps,
} from "@/app/_ui/CatalogModals.controls";
