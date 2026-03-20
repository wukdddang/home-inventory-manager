"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type AlertModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: "default" | "danger";
};

const overlayTransition = {
  duration: 0.2,
  ease: [0.4, 0, 0.2, 1] as const,
};

const panelSpring = {
  type: "spring" as const,
  damping: 26,
  stiffness: 320,
};

/**
 * 닫힐 때 AnimatePresence로 Portal을 잠시 유지해 exit 애니메이션 후 언마운트.
 * (forceMount + 항상 마운트된 투명 오버레이는 클릭/스크롤을 막는 사례가 있어 쓰지 않음)
 */
export function AlertModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  onConfirm,
  variant = "default",
}: AlertModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
          <Dialog.Portal key="alert-modal">
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-10040 bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={overlayTransition}
              />
            </Dialog.Overlay>
            <Dialog.Content
              className="fixed left-1/2 top-1/2 z-10041 w-[min(100vw-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 border-0 bg-transparent p-0 shadow-none outline-none"
              onPointerDownOutside={(e) => e.preventDefault()}
            >
              <motion.div
                className={cn(
                  "rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl",
                )}
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                transition={panelSpring}
              >
              <Dialog.Title className="text-lg font-semibold text-white">
                {title}
              </Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-2 text-sm text-zinc-400">
                  {description}
                </Dialog.Description>
              ) : null}
              <div className="mt-6 flex justify-end gap-2">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="cursor-pointer rounded-xl border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
                  >
                    {cancelLabel}
                  </button>
                </Dialog.Close>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className={cn(
                    "cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold",
                    variant === "danger"
                      ? "bg-rose-600 text-white hover:bg-rose-500"
                      : "bg-teal-500 text-zinc-950 hover:bg-teal-400",
                  )}
                >
                  {confirmLabel}
                </button>
              </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
