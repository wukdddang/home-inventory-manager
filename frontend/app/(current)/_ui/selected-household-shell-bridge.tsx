"use client";

import type { Household } from "@/types/domain";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type SelectedHouseholdShellContextValue = {
  household: Household | null;
  setHousehold: (h: Household | null) => void;
};

const SelectedHouseholdShellContext =
  createContext<SelectedHouseholdShellContextValue | null>(null);

export function SelectedHouseholdShellProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [household, setHouseholdState] = useState<Household | null>(null);
  const setHousehold = useCallback((h: Household | null) => {
    setHouseholdState(h);
  }, []);
  const value = useMemo(
    () => ({ household, setHousehold }),
    [household, setHousehold],
  );
  return (
    <SelectedHouseholdShellContext.Provider value={value}>
      {children}
    </SelectedHouseholdShellContext.Provider>
  );
}

export function useSelectedHouseholdShell(): SelectedHouseholdShellContextValue {
  const ctx = useContext(SelectedHouseholdShellContext);
  if (ctx === null) {
    throw new Error(
      "useSelectedHouseholdShell는 SelectedHouseholdShellProvider 안에서만 사용할 수 있습니다.",
    );
  }
  return ctx;
}
