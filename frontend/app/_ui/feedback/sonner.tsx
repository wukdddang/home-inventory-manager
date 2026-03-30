"use client";

import type { ComponentProps } from "react";
import { Toaster as Sonner } from "sonner";

type ToasterProps = ComponentProps<typeof Sonner>;

/**
 * 앱 본문과 동일: Pretendard(`font-sans`), zinc-950 배경 톤, 얇은 테두리·최소 그림자.
 * Sonner는 포털로 렌더되므로 폰트를 명시해 본문과 맞춤.
 */
export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      offset={16}
      gap={10}
      className="toaster group z-10050 font-sans"
      toastOptions={{
        classNames: {
          toast:
            "group toast w-full max-w-[min(100vw-1.5rem,26rem)] rounded-xl border border-zinc-800/90 bg-zinc-950 p-4 font-sans text-zinc-100 antialiased shadow-sm shadow-black/40 ring-1 ring-zinc-800/40 backdrop-blur-[2px]",
          title:
            "text-sm font-semibold leading-snug tracking-tight text-zinc-50 [font-family:inherit]",
          description:
            "text-xs font-normal leading-relaxed text-zinc-400 [font-family:inherit]",
          actionButton:
            "rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm font-medium text-zinc-100 transition-colors hover:border-zinc-600 hover:bg-zinc-800",
          cancelButton:
            "rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800",
          closeButton:
            "rounded-md border-0 bg-transparent p-1 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200 [&_svg]:size-4",
          success:
            "border-teal-500/25 bg-zinc-950 ring-teal-500/15 [&_[data-icon]]:text-teal-400",
          warning:
            "border-amber-500/25 bg-zinc-950 ring-amber-500/15 [&_[data-icon]]:text-amber-400",
          error:
            "border-rose-500/25 bg-zinc-950 ring-rose-500/15 [&_[data-icon]]:text-rose-400",
          info: "border-zinc-700 bg-zinc-950 ring-zinc-700/50",
        },
      }}
      {...props}
    />
  );
}
