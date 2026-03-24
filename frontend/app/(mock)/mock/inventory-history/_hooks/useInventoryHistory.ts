"use client";

import { useContext } from "react";
import {
  InventoryHistoryContext,
  type InventoryHistoryContextType,
} from "../_context/InventoryHistoryContext";

export function useInventoryHistory(): InventoryHistoryContextType {
  const ctx = useContext(InventoryHistoryContext);
  if (ctx === undefined) {
    throw new Error(
      "useInventoryHistory는 InventoryHistoryProvider 안에서만 사용할 수 있습니다.",
    );
  }
  return ctx;
}
