export class SaveExpirationAlertRuleData {
  productId: string;
  userId?: string | null;
  householdId?: string | null;
  daysBefore: number;
  isActive?: boolean;
}

export class UpdateExpirationAlertRuleData {
  daysBefore?: number;
  isActive?: boolean;
}

export class ExpirationAlertRuleResult {
  id: string;
  productId: string;
  userId: string | null;
  householdId: string | null;
  daysBefore: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
