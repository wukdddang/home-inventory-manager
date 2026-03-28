import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import {
  VerifyEmailHandler,
  VerifyEmailCommand,
} from '@context/auth-context/handlers/commands/verify-email.handler';
import { UserService } from '@domain/user/user.service';
import { User } from '@domain/user/user.entity';

describe('VerifyEmailHandler', () => {
  let handler: VerifyEmailHandler;
  let userService: jest.Mocked<UserService>;

  const mockUserService = {
    인증토큰으로_사용자를_조회한다: jest.fn(),
    사용자를_저장한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerifyEmailHandler,
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    handler = module.get<VerifyEmailHandler>(VerifyEmailHandler);
    userService = module.get(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('이메일 인증을 완료해야 한다', async () => {
      // Given
      const mockUser = {
        id: 'user-1',
        emailVerifiedAt: null,
        emailVerificationToken: 'token-123',
      } as User;

      const command = new VerifyEmailCommand('token-123');
      mockUserService.인증토큰으로_사용자를_조회한다.mockResolvedValue(
        mockUser,
      );
      mockUserService.사용자를_저장한다.mockResolvedValue(mockUser);

      // When
      await handler.execute(command);

      // Then
      expect(mockUser.emailVerifiedAt).toBeInstanceOf(Date);
      expect(mockUser.emailVerificationToken).toBeNull();
      expect(userService.사용자를_저장한다).toHaveBeenCalledWith(mockUser);
    });

    it('유효하지 않은 토큰이면 NotFoundException을 던져야 한다', async () => {
      // Given
      const command = new VerifyEmailCommand('invalid-token');
      mockUserService.인증토큰으로_사용자를_조회한다.mockResolvedValue(null);

      // When & Then
      await expect(handler.execute(command)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
