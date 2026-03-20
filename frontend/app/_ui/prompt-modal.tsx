"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
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
}: Omit<PromptModalProps, "open">) {
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
      <Dialog.Title className="text-lg font-semibold text-white">
        {title}
      </Dialog.Title>
      {description ? (
        <Dialog.Description className="mt-2 text-sm text-zinc-400">
          {description}
        </Dialog.Description>
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
          <Dialog.Close asChild>
            <button
              type="button"
              className="cursor-pointer rounded-xl border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
            >
              {cancelLabel}
            </button>
          </Dialog.Close>
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
  const overlayTransition = {
    duration: 0.2,
    ease: [0.4, 0, 0.2, 1] as const,
  };

  const panelSpring = {
    type: "spring" as const,
    damping: 26,
    stiffness: 320,
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
          <Dialog.Portal key="prompt-modal">
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-10040 bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={overlayTransition}
              />
            </Dialog.Overlay>
            <Dialog.Content className="fixed left-1/2 top-1/2 z-10041 w-[min(100vw-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 border-0 bg-transparent p-0 shadow-none outline-none">
              <motion.div
                className="rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl"
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                transition={panelSpring}
              >
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
              />
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
