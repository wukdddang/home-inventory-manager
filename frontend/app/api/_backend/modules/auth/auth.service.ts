import { BaseService, ServiceResponse } from '../../common/base.service';
import { AUTH_ENDPOINTS } from '../../api-endpoints';

// ── Request DTOs ──
export interface SignupRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ── Response DTOs ──
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface MessageResponse {
  message: string;
}

export class AuthService extends BaseService {
  async 회원가입을_한다(
    body: SignupRequest,
  ): Promise<ServiceResponse<TokenResponse>> {
    return this.handleApiCall(async () => {
      const res = await fetch(AUTH_ENDPOINTS.회원가입, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) await this.parseErrorResponse(res, '회원가입에 실패했습니다.');
      return res.json();
    }, '회원가입에 실패했습니다.');
  }

  async 로그인을_한다(
    body: LoginRequest,
  ): Promise<ServiceResponse<TokenResponse>> {
    return this.handleApiCall(async () => {
      const res = await fetch(AUTH_ENDPOINTS.로그인, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) await this.parseErrorResponse(res, '로그인에 실패했습니다.');
      return res.json();
    }, '로그인에 실패했습니다.');
  }

  async 토큰을_갱신한다(
    body: RefreshRequest,
  ): Promise<ServiceResponse<TokenResponse>> {
    return this.handleApiCall(async () => {
      const res = await fetch(AUTH_ENDPOINTS.토큰갱신, {
        method: 'POST',
        headers: this.authHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) await this.parseErrorResponse(res, '토큰 갱신에 실패했습니다.');
      return res.json();
    }, '토큰 갱신에 실패했습니다.');
  }

  async 로그아웃을_한다(): Promise<ServiceResponse<MessageResponse>> {
    return this.handleApiCall(async () => {
      const res = await fetch(AUTH_ENDPOINTS.로그아웃, {
        method: 'POST',
        headers: this.authHeaders(),
      });
      if (!res.ok) await this.parseErrorResponse(res, '로그아웃에 실패했습니다.');
      return res.json();
    }, '로그아웃에 실패했습니다.');
  }

  async 이메일을_인증한다(
    token: string,
  ): Promise<ServiceResponse<MessageResponse>> {
    return this.handleApiCall(async () => {
      const res = await fetch(
        `${AUTH_ENDPOINTS.이메일인증}?token=${encodeURIComponent(token)}`,
        { method: 'GET', headers: this.authHeaders() },
      );
      if (!res.ok) await this.parseErrorResponse(res, '이메일 인증에 실패했습니다.');
      return res.json();
    }, '이메일 인증에 실패했습니다.');
  }

  async 내정보를_조회한다(): Promise<ServiceResponse<UserProfile>> {
    return this.handleApiCall(async () => {
      const res = await fetch(AUTH_ENDPOINTS.내정보, {
        method: 'GET',
        headers: this.authHeaders(),
      });
      if (!res.ok) await this.parseErrorResponse(res, '내 정보 조회에 실패했습니다.');
      return res.json();
    }, '내 정보 조회에 실패했습니다.');
  }

  async 비밀번호를_변경한다(
    body: ChangePasswordRequest,
  ): Promise<ServiceResponse<MessageResponse>> {
    return this.handleApiCall(async () => {
      const res = await fetch(AUTH_ENDPOINTS.비밀번호변경, {
        method: 'PATCH',
        headers: this.authHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) await this.parseErrorResponse(res, '비밀번호 변경에 실패했습니다.');
      return res.json();
    }, '비밀번호 변경에 실패했습니다.');
  }
}
