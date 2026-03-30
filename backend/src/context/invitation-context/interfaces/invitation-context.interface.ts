// ── Command DTOs ──

export class CreateInvitationData {
  householdId: string;
  invitedByUserId: string;
  role: 'admin' | 'editor' | 'viewer';
  inviteeEmail?: string | null;
  expiresInDays?: number;
}

// ── Result DTOs ──

export class InvitationResult {
  id: string;
  householdId: string;
  householdName: string;
  invitedByUserId: string;
  invitedByDisplayName: string;
  role: string;
  token: string;
  status: string;
  inviteeEmail: string | null;
  acceptedByUserId: string | null;
  acceptedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
}
