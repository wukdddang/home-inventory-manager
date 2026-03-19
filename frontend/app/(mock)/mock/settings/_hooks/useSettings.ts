"use client";

import { useContext } from "react";
import {
  SettingsContext,
  type SettingsContextType,
} from "../_context/SettingsContext";

export function useSettings(): SettingsContextType {
  const ctx = useContext(SettingsContext);
  if (ctx === undefined) {
    throw new Error("useSettings는 SettingsProvider 안에서만 사용할 수 있습니다.");
  }
  return ctx;
}
