"use client";

import * as React from "react";
import { toast as sonnerToast } from "sonner";

export type ToastVariant = "default" | "destructive" | "success" | "warning";

/** 기존 `toast({ title, description, variant })` 호출과 호환 — 내부는 Sonner */
export type ToastInput = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;
  duration?: number;
};

export function toast(input: ToastInput) {
  const { title, description, variant = "default", duration } = input;

  const message = title ?? description ?? "";
  const opts = {
    description: title != null ? description : undefined,
    duration,
  } as const;

  switch (variant) {
    case "destructive":
      return sonnerToast.error(message, opts);
    case "success":
      return sonnerToast.success(message, opts);
    case "warning":
      return sonnerToast.warning(message, opts);
    default:
      return sonnerToast(message, opts);
  }
}
