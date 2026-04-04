"use client";

import { useContext } from "react";
import {
  AppliancesContext,
  type AppliancesContextType,
} from "../_context/AppliancesContext";

export function useAppliances(): AppliancesContextType {
  const ctx = useContext(AppliancesContext);
  if (ctx === undefined) {
    throw new Error(
      "useAppliances는 AppliancesProvider 안에서만 사용할 수 있습니다.",
    );
  }
  return ctx;
}
