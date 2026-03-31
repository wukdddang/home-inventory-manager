export class NotificationResult {
  id: string;
  userId: string;
  householdId: string | null;
  type: string;
  title: string;
  body: string | null;
  readAt: Date | null;
  refType: string | null;
  refId: string | null;
  createdAt: Date;
}
