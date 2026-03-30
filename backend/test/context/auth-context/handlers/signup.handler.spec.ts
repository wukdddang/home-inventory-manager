import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  SignupHandler,
  SignupCommand,
} from '@context/auth-context/handlers/commands/signup.handler';
import { UserService } from '@domain/user/user.service';
import { MailService } from '@common/infrastructure/mail/mail.service';
import { HouseholdKindDefinitionService } from '@domain/household-kind-definition/household-kind-definition.service';
import { User } from '@domain/user/user.entity';

describe('SignupHandler', () => {
  let handler: SignupHandler;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;
  let mailService: jest.Mocked<MailService>;

  const mockUserService = {
    이메일로_사용자를_조회한다: jest.fn(),
    사용자를_생성한다: jest.fn(),
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

  const mockMailService = {
    인증_이메일을_발송한다: jest.fn(),
  };

  const mockKindDefinitionService = {
    기본_유형을_시드한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignupHandler,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MailService, useValue: mockMailService },
        {
          provide: HouseholdKindDefinitionService,
          useValue: mockKindDefinitionService,
        },
      ],
    }).compile();

    handler = module.get<SignupHandler>(SignupHandler);
    userService = module.get(UserService);
    jwtService = module.get(JwtService);
    mailService = module.get(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('회원가입을 처리하고 토큰을 반환해야 한다', async () => {
      // Given
      const command = new SignupCommand(
        'test@example.com',
        'password123',
        '테스트 사용자',
      );

      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        displayName: '테스트 사용자',
        refreshTokenHash: null,
      } as User;

      mockUserService.이메일로_사용자를_조회한다.mockResolvedValue(null);
      mockUserService.사용자를_생성한다.mockResolvedValue(mockUser);
      mockUserService.사용자를_저장한다.mockResolvedValue(mockUser);
      mockJwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');
      mockMailService.인증_이메일을_발송한다.mockResolvedValue(undefined);
      mockKindDefinitionService.기본_유형을_시드한다.mockResolvedValue(
        undefined,
      );

      // When
      const result = await handler.execute(command);

      // Then
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(
        mockKindDefinitionService.기본_유형을_시드한다,
      ).toHaveBeenCalledWith('user-1');
      expect(userService.이메일로_사용자를_조회한다).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(userService.사용자를_생성한다).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          displayName: '테스트 사용자',
        }),
      );
      expect(mailService.인증_이메일을_발송한다).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
      );
    });

    it('이미 존재하는 이메일이면 ConflictException을 던져야 한다', async () => {
      // Given
      const command = new SignupCommand(
        'existing@example.com',
        'password123',
        '기존 사용자',
      );
      mockUserService.이메일로_사용자를_조회한다.mockResolvedValue({
        id: 'user-1',
      } as User);

      // When & Then
      await expect(handler.execute(command)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
