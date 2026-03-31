"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

const overlayEase = [0.4, 0, 0.2, 1] as const;

/** 모달 딤·패널 입·퇴장 공통 길이(초) */
const MOTION_MODAL_DURATION_S = 0.5;

export const motionModalOverlayTransition = {
  duration: MOTION_MODAL_DURATION_S,
  ease: overlayEase,
};

/** 딤과 동일 이징으로 입장 리듬을 맞춤 */
export const motionModalPanelOpenTransition = {
  duration: MOTION_MODAL_DURATION_S,
  ease: overlayEase,
};

export const motionModalPanelCloseTransition = {
  duration: MOTION_MODAL_DURATION_S,
  ease: overlayEase,
};

export type MotionModalLayerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  /** 오버레이(딤) 직접 클릭 시 닫기 */
  closeOnOverlayClick?: boolean;
  /** 패널 루트 class (위치·크기) */
  panelClassName: string;
  /** 패널 내부 role */
  panelRole?: "dialog" | "alertdialog";
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  /** 중첩 모달일 때 z-index를 올려 부모 모달 위에 backdrop을 깔기 위한 오프셋 (기본 0) */
  zOffset?: number;
};

/**
 * Radix 없이 document.body로 포털 + Framer Motion 입·퇴장.
 * `body` overflow 등은 건드리지 않아 레이아웃 스크롤이 막히지 않습니다.
 */
export function MotionModalLayer({
  open,
  onOpenChange,
  children,
  closeOnOverlayClick = true,
  panelClassName,
  panelRole = "dialog",
  ariaLabelledBy,
  ariaDescribedBy,
  zOffset = 0,
}: MotionModalLayerProps) {
  const baseKey = useId().replace(/:/g, "");
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence mode="sync">
      {open ? (
        <>
          <motion.div
            key={`${baseKey}-overlay`}
            className="fixed inset-0 bg-black/60"
            style={{ zIndex: 10040 + zOffset }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: motionModalOverlayTransition }}
            transition={motionModalOverlayTransition}
            onPointerDown={(e) => {
              if (
                closeOnOverlayClick &&
                e.target === e.currentTarget
              ) {
                onOpenChange(false);
              }
            }}
            aria-hidden
          />
          <motion.div
            key={`${baseKey}-panel`}
            role={panelRole}
            aria-modal="true"
            aria-labelledby={ariaLabelledBy}
            aria-describedby={ariaDescribedBy}
            className={panelClassName}
            {...(zOffset ? { style: { zIndex: 10041 + zOffset } } : {})}
            initial={{ opacity: 0, scale: 0.98, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
              opacity: 0,
              scale: 0.98,
              y: 4,
              transition: motionModalPanelCloseTransition,
            }}
            transition={motionModalPanelOpenTransition}
          >
            {children}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
