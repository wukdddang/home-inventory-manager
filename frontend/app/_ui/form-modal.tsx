"use client";

import { MotionModalLayer } from "@/app/_ui/motion-modal-layer";
import { cn } from "@/lib/utils";
import { useId, type ReactNode } from "react";

export type FormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit?: () => void;
  submitDisabled?: boolean;
};

/**
 * 폼 필드가 있는 모달 — Framer Motion 포털 (Radix Dialog 미사용).
 */
export function FormModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  submitLabel = "저장",
  cancelLabel = "취소",
  onSubmit,
  submitDisabled = false,
}: FormModalProps) {
  const uid = useId().replace(/:/g, "");
  const titleId = `motion-form-title-${uid}`;
  const descId = `motion-form-desc-${uid}`;

  return (
    <MotionModalLayer
      open={open}
      onOpenChange={onOpenChange}
      closeOnOverlayClick
      panelClassName="fixed left-1/2 top-1/2 z-10041 max-h-[min(100dvh-2rem,40rem)] w-[min(100vw-2rem,26rem)] -translate-x-1/2 -translate-y-1/2 outline-none"
      ariaLabelledBy={titleId}
      ariaDescribedBy={description ? descId : undefined}
    >
      <div className="flex max-h-[min(100dvh-2rem,40rem)] flex-col rounded-2xl border border-zinc-700 bg-zinc-900 shadow-xl">
        <div className="shrink-0 border-b border-zinc-800 p-5 pb-4">
          <h2 id={titleId} className="text-lg font-semibold text-white">
            {title}
          </h2>
          {description ? (
            <p id={descId} className="mt-2 text-sm text-zinc-400">
              {description}
            </p>
          ) : null}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-4">
          {children}
        </div>
        <div className="flex shrink-0 justify-end gap-2 border-t border-zinc-800 p-4">
          <button
            type="button"
            className="cursor-pointer rounded-xl border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={submitDisabled || !onSubmit}
            onClick={() => onSubmit?.()}
            className={cn(
              "cursor-pointer rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-teal-400 disabled:pointer-events-none disabled:opacity-40",
            )}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </MotionModalLayer>
  );
}
