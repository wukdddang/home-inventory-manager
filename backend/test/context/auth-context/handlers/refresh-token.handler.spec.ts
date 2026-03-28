import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import {
  RefreshTokenHandler,
  RefreshTokenCommand,
} from '@context/auth-context/handlers/commands/refresh-token.handler';
import { UserService } from '@domain/user/user.service';
import { User } from '@domain/user/user.entity';

describe('RefreshTokenHandler', () => {
  let handler: RefreshTokenHandler;
  let userService: jest.Mocked<UserService>;

  const mockUserService = {
    ID로_사용자를_조회한다: jest.fn(),
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
        RefreshTokenHandler,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    handler = module.get<RefreshTokenHandler>(RefreshTokenHandler);
    userService = module.get(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('유효한 Refresh Token으로 새 토큰을 발급해야 한다', async () => {
      // Given
      const refreshToken = 'valid-refresh-token';
      const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        refreshTokenHash,
      } as User;

      const command = new RefreshTokenCommand('user-1', refreshToken);
      mockUserService.ID로_사용자를_조회한다.mockResolvedValue(mockUser);
      mockUserService.사용자를_저장한다.mockResolvedValue(mockUser);
      mockJwtService.sign
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');

      // When
      const result = await handler.execute(command);

      // Then
      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
    });

    it('사용자가 없으면 UnauthorizedException을 던져야 한다', async () => {
      // Given
      const command = new RefreshTokenCommand('not-exist', 'token');
      mockUserService.ID로_사용자를_조회한다.mockResolvedValue(null);

      // When & Then
      await expect(handler.execute(command)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('refreshTokenHash가 null이면 UnauthorizedException을 던져야 한다', async () => {
      // Given
      const mockUser = {
        id: 'user-1',
        refreshTokenHash: null,
      } as User;
      const command = new RefreshTokenCommand('user-1', 'token');
      mockUserService.ID로_사용자를_조회한다.mockResolvedValue(mockUser);

      // When & Then
      await expect(handler.execute(command)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('Refresh Token이 일치하지 않으면 UnauthorizedException을 던져야 한다', async () => {
      // Given
      const refreshTokenHash = await bcrypt.hash('correct-token', 10);
      const mockUser = {
        id: 'user-1',
        refreshTokenHash,
      } as User;
      const command = new RefreshTokenCommand('user-1', 'wrong-token');
      mockUserService.ID로_사용자를_조회한다.mockResolvedValue(mockUser);

      // When & Then
      await expect(handler.execute(command)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
