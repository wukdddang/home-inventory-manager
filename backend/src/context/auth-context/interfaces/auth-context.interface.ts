// ── Command DTOs ──

export class SignupData {
  email: string;
  password: string;
  displayName: string;
}

export class LoginData {
  email: string;
  password: string;
}

export class ChangePasswordData {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

// ── Result DTOs ──

export class AuthTokenResult {
  accessToken: string;
  refreshToken: string;
}

export class UserProfileResult {
  id: string;
  email: string;
  displayName: string;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
}
