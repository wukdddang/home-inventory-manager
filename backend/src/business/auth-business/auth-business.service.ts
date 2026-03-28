import { Injectable } from '@nestjs/common';
import { AuthContextService } from '../../context/auth-context/auth-context.service';
import {
  AuthTokenResult,
  ChangePasswordData,
  LoginData,
  SignupData,
  UserProfileResult,
} from '../../context/auth-context/interfaces/auth-context.interface';

@Injectable()
export class AuthBusinessService {
  constructor(private readonly authContextService: AuthContextService) {}

  async 회원가입을_한다(data: SignupData): Promise<AuthTokenResult> {
    return this.authContextService.회원가입을_한다(data);
  }

  async 로그인을_한다(data: LoginData): Promise<AuthTokenResult> {
    return this.authContextService.로그인을_한다(data);
  }

  async 토큰을_갱신한다(
    userId: string,
    refreshToken: string,
  ): Promise<AuthTokenResult> {
    return this.authContextService.토큰을_갱신한다(userId, refreshToken);
  }

  async 로그아웃을_한다(userId: string): Promise<void> {
    return this.authContextService.로그아웃을_한다(userId);
  }

  async 이메일_인증을_완료한다(token: string): Promise<void> {
    return this.authContextService.이메일_인증을_완료한다(token);
  }

  async 비밀번호를_변경한다(data: ChangePasswordData): Promise<void> {
    return this.authContextService.비밀번호를_변경한다(data);
  }

  async 내_정보를_조회한다(userId: string): Promise<UserProfileResult> {
    return this.authContextService.내_정보를_조회한다(userId);
  }
}
