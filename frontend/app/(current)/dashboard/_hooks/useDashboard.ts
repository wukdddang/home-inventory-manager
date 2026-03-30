"use client";

import { useContext } from "react";
import {
  DashboardContext,
  type DashboardContextType,
} from "../_context/DashboardContext";

export function useDashboard(): DashboardContextType {
  const ctx = useContext(DashboardContext);
  if (ctx === undefined) {
    throw new Error("useDashboard는 DashboardProvider 안에서만 사용할 수 있습니다.");
  }
  return ctx;
}
