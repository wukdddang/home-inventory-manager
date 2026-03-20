"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const overlayEase = [0.4, 0, 0.2, 1] as const;

export const motionModalOverlayTransition = {
  duration: 0.22,
  ease: overlayEase,
};

export const motionModalPanelOpenTransition = {
  type: "spring" as const,
  damping: 28,
  stiffness: 340,
};

export const motionModalPanelCloseTransition = {
  duration: 0.2,
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
}: MotionModalLayerProps) {
  const baseKey = useId().replace(/:/g, "");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

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
            className="fixed inset-0 z-10040 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
              opacity: 0,
              scale: 0.96,
              y: 8,
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
