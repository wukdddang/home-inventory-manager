import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AuthContextService } from '@context/auth-context/auth-context.service';
import { SignupCommand } from '@context/auth-context/handlers/commands/signup.handler';
import { LoginCommand } from '@context/auth-context/handlers/commands/login.handler';
import { RefreshTokenCommand } from '@context/auth-context/handlers/commands/refresh-token.handler';
import { LogoutCommand } from '@context/auth-context/handlers/commands/logout.handler';
import { VerifyEmailCommand } from '@context/auth-context/handlers/commands/verify-email.handler';
import { ChangePasswordCommand } from '@context/auth-context/handlers/commands/change-password.handler';
import { GetMyProfileQuery } from '@context/auth-context/handlers/queries/get-my-profile.handler';

describe('AuthContextService', () => {
  let service: AuthContextService;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

  const mockCommandBus = { execute: jest.fn() };
  const mockQueryBus = { execute: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthContextService,
        { provide: CommandBus, useValue: mockCommandBus },
        { provide: QueryBus, useValue: mockQueryBus },
      ],
    }).compile();

    service = module.get<AuthContextService>(AuthContextService);
    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('회원가입을_한다', () => {
    it('SignupCommand를 실행해야 한다', async () => {
      // Given
      const data = {
        email: 'test@example.com',
        password: 'password123',
        displayName: '테스트',
      };
      const mockResult = {
        accessToken: 'at',
        refreshToken: 'rt',
      };
      mockCommandBus.execute.mockResolvedValue(mockResult);

      // When
      const result = await service.회원가입을_한다(data);

      // Then
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(SignupCommand),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('로그인을_한다', () => {
    it('LoginCommand를 실행해야 한다', async () => {
      // Given
      const data = { email: 'test@example.com', password: 'password123' };
      mockCommandBus.execute.mockResolvedValue({
        accessToken: 'at',
        refreshToken: 'rt',
      });

      // When
      await service.로그인을_한다(data);

      // Then
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(LoginCommand),
      );
    });
  });

  describe('토큰을_갱신한다', () => {
    it('RefreshTokenCommand를 실행해야 한다', async () => {
      // Given
      mockCommandBus.execute.mockResolvedValue({
        accessToken: 'at',
        refreshToken: 'rt',
      });

      // When
      await service.토큰을_갱신한다('user-1', 'refresh-token');

      // Then
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(RefreshTokenCommand),
      );
    });
  });

  describe('로그아웃을_한다', () => {
    it('LogoutCommand를 실행해야 한다', async () => {
      // Given
      mockCommandBus.execute.mockResolvedValue(undefined);

      // When
      await service.로그아웃을_한다('user-1');

      // Then
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(LogoutCommand),
      );
    });
  });

  describe('이메일_인증을_완료한다', () => {
    it('VerifyEmailCommand를 실행해야 한다', async () => {
      // Given
      mockCommandBus.execute.mockResolvedValue(undefined);

      // When
      await service.이메일_인증을_완료한다('token-123');

      // Then
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(VerifyEmailCommand),
      );
    });
  });

  describe('비밀번호를_변경한다', () => {
    it('ChangePasswordCommand를 실행해야 한다', async () => {
      // Given
      mockCommandBus.execute.mockResolvedValue(undefined);

      // When
      await service.비밀번호를_변경한다({
        userId: 'user-1',
        currentPassword: 'old',
        newPassword: 'new',
      });

      // Then
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(ChangePasswordCommand),
      );
    });
  });

  describe('내_정보를_조회한다', () => {
    it('GetMyProfileQuery를 실행해야 한다', async () => {
      // Given
      const mockProfile = {
        id: 'user-1',
        email: 'test@example.com',
        displayName: '테스트',
        emailVerifiedAt: null,
        lastLoginAt: null,
        createdAt: new Date(),
      };
      mockQueryBus.execute.mockResolvedValue(mockProfile);

      // When
      const result = await service.내_정보를_조회한다('user-1');

      // Then
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(GetMyProfileQuery),
      );
      expect(result).toEqual(mockProfile);
    });
  });
});
