"use client";

import { useContext } from "react";
import { LoginContext, type LoginContextType } from "../_context/LoginContext";

export function useLogin(): LoginContextType {
  const ctx = useContext(LoginContext);
  if (ctx === undefined) {
    throw new Error("useLogin은 LoginProvider 안에서만 사용할 수 있습니다.");
  }
  return ctx;
}
