"use client";

import { useEffect, useState } from "react";

export type DeviceType = "mobile" | "tablet" | "desktop";

const MOBILE_MAX = 768;
const TABLET_MAX = 1024;

function getDeviceType(width: number): DeviceType {
  if (width < MOBILE_MAX) return "mobile";
  if (width < TABLET_MAX) return "tablet";
  return "desktop";
}

/**
 * matchMedia 기반 디바이스 타입 감지.
 * SSR 기본값은 desktop (hydration mismatch 방지).
 */
export function useDeviceLayout() {
  const [deviceType, setDeviceType] = useState<DeviceType>("desktop");

  useEffect(() => {
    const update = () => setDeviceType(getDeviceType(window.innerWidth));
    update();

    const mqMobile = window.matchMedia(`(max-width: ${MOBILE_MAX - 1}px)`);
    const mqTablet = window.matchMedia(
      `(min-width: ${MOBILE_MAX}px) and (max-width: ${TABLET_MAX - 1}px)`,
    );

    const handler = () => update();
    mqMobile.addEventListener("change", handler);
    mqTablet.addEventListener("change", handler);
    return () => {
      mqMobile.removeEventListener("change", handler);
      mqTablet.removeEventListener("change", handler);
    };
  }, []);

  return {
    deviceType,
    isMobile: deviceType === "mobile",
    isTablet: deviceType === "tablet",
    isDesktop: deviceType === "desktop",
    /** 모바일 또는 태블릿 (모바일 레이아웃 사용) */
    isMobileLayout: deviceType !== "desktop",
  };
}
