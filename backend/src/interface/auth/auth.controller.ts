import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthBusinessService } from '../../business/auth-business/auth-business.service';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../common/auth/decorators/current-user.decorator';
import { JwtAuthGuard, JwtRefreshGuard } from '../../common/auth/guards/jwt-auth.guard';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authBusinessService: AuthBusinessService) {}

  @Post('signup')
  async 회원가입을_한다(@Body() dto: SignupDto) {
    return this.authBusinessService.회원가입을_한다({
      email: dto.email,
      password: dto.password,
      displayName: dto.displayName,
    });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async 로그인을_한다(@Body() dto: LoginDto) {
    return this.authBusinessService.로그인을_한다({
      email: dto.email,
      password: dto.password,
    });
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  async 토큰을_갱신한다(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: RefreshTokenDto,
  ) {
    return this.authBusinessService.토큰을_갱신한다(
      user.userId,
      dto.refreshToken,
    );
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async 로그아웃을_한다(@CurrentUser() user: CurrentUserPayload) {
    await this.authBusinessService.로그아웃을_한다(user.userId);
    return { message: '로그아웃되었습니다' };
  }

  @Get('verify-email')
  async 이메일_인증을_완료한다(@Query('token') token: string) {
    await this.authBusinessService.이메일_인증을_완료한다(token);
    return { message: '이메일 인증이 완료되었습니다' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async 내_정보를_조회한다(@CurrentUser() user: CurrentUserPayload) {
    return this.authBusinessService.내_정보를_조회한다(user.userId);
  }

  @Patch('password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async 비밀번호를_변경한다(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authBusinessService.비밀번호를_변경한다({
      userId: user.userId,
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
    });
    return { message: '비밀번호가 변경되었습니다. 다시 로그인해주세요.' };
  }
}
