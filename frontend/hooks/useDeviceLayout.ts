"use client";

import { useSyncExternalStore } from "react";

export type DeviceType = "mobile" | "tablet" | "desktop";

const MOBILE_MAX = 768;
const TABLET_MAX = 1024;

function getDeviceType(width: number): DeviceType {
  if (width < MOBILE_MAX) return "mobile";
  if (width < TABLET_MAX) return "tablet";
  return "desktop";
}

function subscribe(callback: () => void): () => void {
  const mqMobile = window.matchMedia(`(max-width: ${MOBILE_MAX - 1}px)`);
  const mqTablet = window.matchMedia(
    `(min-width: ${MOBILE_MAX}px) and (max-width: ${TABLET_MAX - 1}px)`,
  );
  mqMobile.addEventListener("change", callback);
  mqTablet.addEventListener("change", callback);
  return () => {
    mqMobile.removeEventListener("change", callback);
    mqTablet.removeEventListener("change", callback);
  };
}

function getSnapshot(): DeviceType {
  return getDeviceType(window.innerWidth);
}

function getServerSnapshot(): DeviceType {
  return "desktop";
}

/**
 * matchMedia 기반 디바이스 타입 감지.
 * useSyncExternalStore를 사용하여 클라이언트 내비게이션 시 즉시 올바른 값 반환.
 */
export function useDeviceLayout() {
  const deviceType = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return {
    deviceType,
    isMobile: deviceType === "mobile",
    isTablet: deviceType === "tablet",
    isDesktop: deviceType === "desktop",
    /** 모바일 또는 태블릿 (모바일 레이아웃 사용) */
    isMobileLayout: deviceType !== "desktop",
  };
}
