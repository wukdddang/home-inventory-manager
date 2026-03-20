"use client";

import { MotionModalLayer } from "@/app/_ui/motion-modal-layer";
import { useId, useState } from "react";

export type PromptModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  label?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onSubmit: (value: string) => void;
};

function PromptModalFields({
  title,
  description,
  label = "입력",
  defaultValue = "",
  confirmLabel = "저장",
  cancelLabel = "취소",
  onSubmit,
  onOpenChange,
  titleId,
  descId,
}: Omit<PromptModalProps, "open"> & {
  titleId: string;
  descId: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const inputId = useId();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (!v) return;
    onSubmit(v);
    onOpenChange(false);
  };

  return (
    <>
      <h2 id={titleId} className="text-lg font-semibold text-white">
        {title}
      </h2>
      {description ? (
        <p id={descId} className="mt-2 text-sm text-zinc-400">
          {description}
        </p>
      ) : null}
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="space-y-1">
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-zinc-400"
          >
            {label}
          </label>
          <input
            id={inputId}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500"
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="cursor-pointer rounded-xl border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            className="cursor-pointer rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-teal-400"
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </>
  );
}

export function PromptModal({
  open,
  onOpenChange,
  title,
  description,
  label,
  defaultValue,
  confirmLabel,
  cancelLabel,
  onSubmit,
}: PromptModalProps) {
  const uid = useId().replace(/:/g, "");
  const titleId = `motion-prompt-title-${uid}`;
  const descId = `motion-prompt-desc-${uid}`;

  return (
    <MotionModalLayer
      open={open}
      onOpenChange={onOpenChange}
      closeOnOverlayClick
      panelClassName="fixed left-1/2 top-1/2 z-10041 w-[min(100vw-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 outline-none"
      ariaLabelledBy={titleId}
      ariaDescribedBy={description ? descId : undefined}
    >
      <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
        <PromptModalFields
          key={defaultValue}
          title={title}
          description={description}
          label={label}
          defaultValue={defaultValue}
          confirmLabel={confirmLabel}
          cancelLabel={cancelLabel}
          onSubmit={onSubmit}
          onOpenChange={onOpenChange}
          titleId={titleId}
          descId={descId}
        />
      </div>
    </MotionModalLayer>
  );
}
