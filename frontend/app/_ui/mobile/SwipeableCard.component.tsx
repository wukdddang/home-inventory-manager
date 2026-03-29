"use client";

import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import type { ReactNode } from "react";

type SwipeAction = {
  label: string;
  color: string;
  onClick: () => void;
};

type SwipeableCardProps = {
  children: ReactNode;
  actions: SwipeAction[];
  className?: string;
};

const ACTION_WIDTH = 72;
const THRESHOLD = 40;

export function SwipeableCard({
  children,
  actions,
  className,
}: SwipeableCardProps) {
  const x = useMotionValue(0);
  const totalActionsWidth = actions.length * ACTION_WIDTH;

  const actionsOpacity = useTransform(
    x,
    [-totalActionsWidth, -THRESHOLD, 0],
    [1, 0.6, 0],
  );

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const offset = info.offset.x;
    if (offset < -THRESHOLD) {
      x.set(-totalActionsWidth);
    } else {
      x.set(0);
    }
  };

  const handleActionClick = (action: SwipeAction) => {
    action.onClick();
    x.set(0);
  };

  return (
    <div className={`relative overflow-hidden rounded-xl ${className ?? ""}`}>
      {/* 액션 버튼 (뒷면) */}
      <motion.div
        className="absolute inset-y-0 right-0 flex items-stretch"
        style={{ opacity: actionsOpacity }}
      >
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => handleActionClick(action)}
            className={`flex w-[72px] cursor-pointer items-center justify-center text-sm font-medium text-white ${action.color}`}
          >
            {action.label}
          </button>
        ))}
      </motion.div>

      {/* 카드 본체 */}
      <motion.div
        className="relative z-10"
        style={{ x }}
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -totalActionsWidth, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
