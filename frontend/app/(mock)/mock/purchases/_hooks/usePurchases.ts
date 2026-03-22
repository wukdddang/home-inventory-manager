"use client";

import { useContext } from "react";
import {
  PurchasesContext,
  type PurchasesContextType,
} from "../_context/PurchasesContext";

export function usePurchases(): PurchasesContextType {
  const ctx = useContext(PurchasesContext);
  if (ctx === undefined) {
    throw new Error("usePurchases는 PurchasesProvider 안에서만 사용할 수 있습니다.");
  }
  return ctx;
}
