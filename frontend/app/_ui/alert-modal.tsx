"use client";

import { MotionModalLayer } from "@/app/_ui/motion-modal-layer";
import { cn } from "@/lib/utils";
import { useId } from "react";

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

/**
 * 확인·취소 알림. 오버레이 클릭으로는 닫지 않음 (기존 Radix 동작과 동일).
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
  const uid = useId().replace(/:/g, "");
  const titleId = `motion-alert-title-${uid}`;
  const descId = `motion-alert-desc-${uid}`;

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <MotionModalLayer
      open={open}
      onOpenChange={onOpenChange}
      closeOnOverlayClick={false}
      panelRole="alertdialog"
      panelClassName="fixed left-1/2 top-1/2 z-10041 w-[min(100vw-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 outline-none"
      ariaLabelledBy={titleId}
      ariaDescribedBy={description ? descId : undefined}
    >
      <div
        className={cn(
          "rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl",
        )}
      >
        <h2 id={titleId} className="text-lg font-semibold text-white">
          {title}
        </h2>
        {description ? (
          <p id={descId} className="mt-2 text-sm text-zinc-400">
            {description}
          </p>
        ) : null}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="cursor-pointer rounded-xl border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </button>
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
      </div>
    </MotionModalLayer>
  );
}
