"use client";

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/app/_ui/feedback/toast";
import { useToast } from "@/hooks/use-toast";

function ToastViewportHost() {
  const { toasts } = useToast();

  return (
    <>
      {toasts.map((toast) => {
        const { id, title, description, action, duration, ...props } = toast;
        void duration;
        return (
        <Toast key={id} duration={Number.POSITIVE_INFINITY} {...props}>
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
      <ToastViewport />
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
