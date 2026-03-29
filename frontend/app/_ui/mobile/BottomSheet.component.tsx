"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* 오버레이 */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* 시트 */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-2xl bg-zinc-900 md:mx-auto md:max-w-md"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            {/* 드래그 핸들 */}
            <div className="flex shrink-0 justify-center py-3">
              <div className="h-1 w-10 rounded-full bg-zinc-600" />
            </div>
            {title && (
              <div className="shrink-0 px-5 pb-3">
                <h3 className="text-base font-semibold text-zinc-100">
                  {title}
                </h3>
              </div>
            )}
            <div className="flex-1 overflow-y-auto overscroll-y-contain px-5 pb-5">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
