// ── Appliance DTOs ──

export class CreateApplianceData {
    householdId: string;
    roomId?: string | null;
    userId: string;
    name: string;
    brand?: string | null;
    modelName?: string | null;
    serialNumber?: string | null;
    purchasedAt?: string | null;
    purchasePrice?: number | null;
    warrantyExpiresAt?: string | null;
    manualUrl?: string | null;
    memo?: string | null;
}

export class UpdateApplianceData {
    roomId?: string | null;
    name?: string;
    brand?: string | null;
    modelName?: string | null;
    serialNumber?: string | null;
    purchasedAt?: string | null;
    purchasePrice?: number | null;
    warrantyExpiresAt?: string | null;
    manualUrl?: string | null;
    memo?: string | null;
}

export class ApplianceResult {
    id: string;
    householdId: string;
    roomId: string | null;
    userId: string;
    name: string;
    brand: string | null;
    modelName: string | null;
    serialNumber: string | null;
    purchasedAt: string | null;
    purchasePrice: number | null;
    warrantyExpiresAt: string | null;
    manualUrl: string | null;
    status: 'active' | 'retired';
    memo: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// ── MaintenanceSchedule DTOs ──

export class CreateMaintenanceScheduleData {
    applianceId: string;
    taskName: string;
    description?: string | null;
    recurrenceRule: {
        frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
        interval: number;
        dayOfMonth?: number;
        dayOfWeek?: number;
        monthOfYear?: number;
    };
    nextOccurrenceAt: string;
}

export class UpdateMaintenanceScheduleData {
    taskName?: string;
    description?: string | null;
    recurrenceRule?: CreateMaintenanceScheduleData['recurrenceRule'];
    nextOccurrenceAt?: string;
}

export class MaintenanceScheduleResult {
    id: string;
    applianceId: string;
    taskName: string;
    description: string | null;
    recurrenceRule: CreateMaintenanceScheduleData['recurrenceRule'];
    nextOccurrenceAt: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ── MaintenanceLog DTOs ──

export class CreateMaintenanceLogData {
    applianceId: string;
    maintenanceScheduleId?: string | null;
    type: 'scheduled' | 'repair' | 'inspection' | 'other';
    description: string;
    householdMemberId?: string | null;
    servicedBy?: string | null;
    cost?: number | null;
    performedAt: string;
    memo?: string | null;
}

export class MaintenanceLogResult {
    id: string;
    applianceId: string;
    maintenanceScheduleId: string | null;
    type: 'scheduled' | 'repair' | 'inspection' | 'other';
    description: string;
    householdMemberId: string | null;
    servicedBy: string | null;
    cost: number | null;
    performedAt: string;
    memo: string | null;
    createdAt: Date;
}
