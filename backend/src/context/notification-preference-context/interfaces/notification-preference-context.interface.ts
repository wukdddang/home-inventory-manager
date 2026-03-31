// ── Command DTOs ──

export class SaveNotificationPreferenceData {
  userId: string;
  householdId?: string | null;
  notifyExpiration?: boolean;
  notifyShopping?: boolean;
  notifyLowStock?: boolean;
  expirationDaysBefore?: number | null;
  expirationRuleScope?: string | null;
  notifyExpiredLots?: boolean;
  expirationSameDayReminder?: boolean;
  shoppingNotifyListUpdates?: boolean;
  shoppingTripReminder?: boolean;
  shoppingTripReminderWeekday?: number | null;
  lowStockRespectMinLevel?: boolean;
}

export class UpdateNotificationPreferenceData {
  notifyExpiration?: boolean;
  notifyShopping?: boolean;
  notifyLowStock?: boolean;
  expirationDaysBefore?: number | null;
  expirationRuleScope?: string | null;
  notifyExpiredLots?: boolean;
  expirationSameDayReminder?: boolean;
  shoppingNotifyListUpdates?: boolean;
  shoppingTripReminder?: boolean;
  shoppingTripReminderWeekday?: number | null;
  lowStockRespectMinLevel?: boolean;
}

// ── Result DTOs ──

export class NotificationPreferenceResult {
  id: string;
  userId: string;
  householdId: string | null;
  notifyExpiration: boolean;
  notifyShopping: boolean;
  notifyLowStock: boolean;
  expirationDaysBefore: number | null;
  expirationRuleScope: string | null;
  notifyExpiredLots: boolean;
  expirationSameDayReminder: boolean;
  shoppingNotifyListUpdates: boolean;
  shoppingTripReminder: boolean;
  shoppingTripReminderWeekday: number | null;
  lowStockRespectMinLevel: boolean;
  createdAt: Date;
  updatedAt: Date;
}
