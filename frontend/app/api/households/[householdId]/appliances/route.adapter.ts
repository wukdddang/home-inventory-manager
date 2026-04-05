import type { Appliance, MaintenanceSchedule, MaintenanceLog } from "@/types/domain";

// Backend → Frontend mappings
export function toAppliance(raw: any): Appliance {
  return {
    id: raw.id,
    householdId: raw.householdId,
    name: raw.name,
    brand: raw.brand ?? undefined,
    modelName: raw.modelName ?? undefined,
    purchasedOn: raw.purchasedAt ?? undefined,
    warrantyExpiresOn: raw.warrantyExpiresAt ?? undefined,
    roomId: raw.roomId ?? undefined,
    status: raw.status === "retired" ? "disposed" : "active",
    disposedOn: raw.status === "retired" ? (raw.updatedAt?.slice(0, 10) ?? undefined) : undefined,
    createdAt: raw.createdAt,
  };
}

export function toSchedule(raw: any): MaintenanceSchedule {
  const rule = raw.recurrenceRule;
  let repeatRule: MaintenanceSchedule["repeatRule"] = "monthly";
  if (rule) {
    const freq = rule.frequency;
    const interval = rule.interval ?? 1;
    if (freq === "yearly" || (freq === "monthly" && interval === 12)) repeatRule = "annual";
    else if (freq === "monthly" && interval === 6) repeatRule = "semiannual";
    else if (freq === "monthly" && interval === 3) repeatRule = "quarterly";
    else repeatRule = "monthly";
  }
  return {
    id: raw.id,
    applianceId: raw.applianceId,
    taskName: raw.taskName,
    repeatRule,
    startDate: raw.createdAt?.slice(0, 10) ?? raw.nextOccurrenceAt,
    nextDueDate: raw.nextOccurrenceAt,
    isActive: raw.isActive,
  };
}

export function toLog(raw: any): MaintenanceLog {
  return {
    id: raw.id,
    applianceId: raw.applianceId,
    scheduleId: raw.maintenanceScheduleId ?? undefined,
    type: raw.type === "other" ? "inspection" : raw.type,
    description: raw.description,
    providerName: raw.servicedBy ?? undefined,
    cost: raw.cost != null ? Number(raw.cost) : undefined,
    completedOn: raw.performedAt,
    createdAt: raw.createdAt,
  };
}

// Frontend → Backend (for create/update requests)
export function fromApplianceDraft(draft: Partial<Appliance>): Record<string, unknown> {
  return {
    name: draft.name,
    brand: draft.brand ?? null,
    modelName: draft.modelName ?? null,
    roomId: draft.roomId ?? null,
    purchasedAt: draft.purchasedOn ?? null,
    warrantyExpiresAt: draft.warrantyExpiresOn ?? null,
  };
}

export function fromScheduleDraft(draft: Partial<MaintenanceSchedule>): Record<string, unknown> {
  const ruleMap: Record<string, { frequency: string; interval: number }> = {
    monthly: { frequency: "monthly", interval: 1 },
    quarterly: { frequency: "monthly", interval: 3 },
    semiannual: { frequency: "monthly", interval: 6 },
    annual: { frequency: "yearly", interval: 1 },
  };
  return {
    taskName: draft.taskName,
    recurrenceRule: draft.repeatRule ? ruleMap[draft.repeatRule] : undefined,
    nextOccurrenceAt: draft.nextDueDate,
  };
}

export function fromLogDraft(draft: Partial<MaintenanceLog>): Record<string, unknown> {
  return {
    type: draft.type,
    description: draft.description,
    maintenanceScheduleId: draft.scheduleId ?? null,
    servicedBy: draft.providerName ?? null,
    cost: draft.cost ?? null,
    performedAt: draft.completedOn,
  };
}
