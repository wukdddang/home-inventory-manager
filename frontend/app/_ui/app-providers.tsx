"use client";

import { useState } from "react";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/app/_ui/feedback/toast";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/** 이 개수를 초과하면 나머지 토스트를 겹쳐서 표시 */
const STACK_AFTER = 2;

function ToastViewportHost() {
  const { toasts } = useToast();
  const [hovered, setHovered] = useState(false);

  const shouldStack = toasts.length > STACK_AFTER;
  const collapsed = shouldStack && !hovered;

  return (
    <>
      {toasts.map((toast, index) => {
        const { id, title, description, action, duration, ...props } = toast;
        void duration;

        const isStacked = collapsed && index >= STACK_AFTER;
        const stackDepth = isStacked
          ? Math.min(index - STACK_AFTER + 1, 3)
          : 0;

        return (
          <Toast
            key={id}
            duration={Number.POSITIVE_INFINITY}
            {...props}
            className={cn(
              props.className,
              "transition-all duration-300 ease-out",
            )}
            style={
              isStacked
                ? {
                    maxHeight: `${Math.max(4, 12 - stackDepth * 4)}px`,
                    transform: `scale(${1 - stackDepth * 0.04})`,
                    opacity: Math.max(0.35, 1 - stackDepth * 0.3),
                    transformOrigin: "top center",
                    pointerEvents: "none" as const,
                  }
                : { maxHeight: "12rem" }
            }
          >
            <div className="grid gap-1">
              {title ? <ToastTitle>{title}</ToastTitle> : null}
              {description ? (
                <ToastDescription>{description}</ToastDescription>
              ) : null}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport
        className={collapsed ? "pointer-events-auto" : undefined}
        onPointerEnter={() => shouldStack && setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      />
    </>
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider swipeDirection="right" duration={Number.POSITIVE_INFINITY}>
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
      <ToastViewportHost />
    </ToastProvider>
  );
}
