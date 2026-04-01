"use client";

import { useContext } from "react";
import {
  VerifyEmailContext,
  type VerifyEmailContextType,
} from "../_context/VerifyEmailContext";

export function useVerifyEmail(): VerifyEmailContextType {
  const ctx = useContext(VerifyEmailContext);
  if (ctx === undefined) {
    throw new Error(
      "useVerifyEmail은 VerifyEmailProvider 안에서만 사용할 수 있습니다.",
    );
  }
  return ctx;
}
