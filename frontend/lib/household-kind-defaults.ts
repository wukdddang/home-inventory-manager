import type { HouseholdKindDefinition } from "@/types/domain";

export const DEFAULT_HOUSEHOLD_KIND_DEFINITIONS: HouseholdKindDefinition[] = [
  { id: "home", label: "집", sortOrder: 0 },
  { id: "office", label: "사무실", sortOrder: 1 },
  { id: "vehicle", label: "차량", sortOrder: 2 },
  { id: "other", label: "기타", sortOrder: 3 },
];

export function cloneDefaultHouseholdKindDefinitions(): HouseholdKindDefinition[] {
  return structuredClone(DEFAULT_HOUSEHOLD_KIND_DEFINITIONS);
}

export function sortHouseholdKindDefinitions(
  defs: HouseholdKindDefinition[],
): HouseholdKindDefinition[] {
  return [...defs].sort(
    (a, b) =>
      (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
      a.label.localeCompare(b.label, "ko"),
  );
}

export function getHouseholdKindLabel(
  id: string,
  defs: HouseholdKindDefinition[],
): string {
  return defs.find((d) => d.id === id)?.label ?? id;
}
