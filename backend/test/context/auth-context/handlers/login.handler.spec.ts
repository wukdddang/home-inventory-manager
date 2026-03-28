import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import {
  LoginHandler,
  LoginCommand,
} from '@context/auth-context/handlers/commands/login.handler';
import { UserService } from '@domain/user/user.service';
import { User } from '@domain/user/user.entity';

describe('LoginHandler', () => {
  let handler: LoginHandler;
  let userService: jest.Mocked<UserService>;

  const mockUserService = {
    이메일로_사용자를_조회한다: jest.fn(),
    사용자를_저장한다: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_REFRESH_EXPIRES_IN: '7d',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginHandler,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    handler = module.get<LoginHandler>(LoginHandler);
    userService = module.get(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('올바른 자격증명으로 로그인하고 토큰을 반환해야 한다', async () => {
      // Given
      const passwordHash = await bcrypt.hash('password123', 10);
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash,
        lastLoginAt: null,
        refreshTokenHash: null,
      } as User;

      const command = new LoginCommand('test@example.com', 'password123');
      mockUserService.이메일로_사용자를_조회한다.mockResolvedValue(mockUser);
      mockUserService.사용자를_저장한다.mockResolvedValue(mockUser);
      mockJwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      // When
      const result = await handler.execute(command);

      // Then
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(mockUser.lastLoginAt).toBeInstanceOf(Date);
    });

    it('존재하지 않는 이메일이면 UnauthorizedException을 던져야 한다', async () => {
      // Given
      const command = new LoginCommand('notfound@example.com', 'password123');
      mockUserService.이메일로_사용자를_조회한다.mockResolvedValue(null);

      // When & Then
      await expect(handler.execute(command)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('비밀번호가 틀리면 UnauthorizedException을 던져야 한다', async () => {
      // Given
      const passwordHash = await bcrypt.hash('correct-password', 10);
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash,
      } as User;

      const command = new LoginCommand('test@example.com', 'wrong-password');
      mockUserService.이메일로_사용자를_조회한다.mockResolvedValue(mockUser);

      // When & Then
      await expect(handler.execute(command)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
