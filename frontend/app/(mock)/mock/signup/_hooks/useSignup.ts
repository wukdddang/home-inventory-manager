"use client";

import { useContext } from "react";
import {
  SignupContext,
  type SignupContextType,
} from "@/app/(current)/signup/_context/SignupContext";

export function useSignup(): SignupContextType {
  const ctx = useContext(SignupContext);
  if (ctx === undefined) {
    throw new Error("useSignup은 SignupProvider 안에서만 사용할 수 있습니다.");
  }
  return ctx;
}
