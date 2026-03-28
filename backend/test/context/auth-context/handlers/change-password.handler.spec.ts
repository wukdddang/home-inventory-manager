import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  ChangePasswordHandler,
  ChangePasswordCommand,
} from '@context/auth-context/handlers/commands/change-password.handler';
import { UserService } from '@domain/user/user.service';
import { User } from '@domain/user/user.entity';

describe('ChangePasswordHandler', () => {
  let handler: ChangePasswordHandler;
  let userService: jest.Mocked<UserService>;

  const mockUserService = {
    ID로_사용자를_조회한다: jest.fn(),
    사용자를_저장한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChangePasswordHandler,
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    handler = module.get<ChangePasswordHandler>(ChangePasswordHandler);
    userService = module.get(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('비밀번호를 변경하고 refreshTokenHash를 null로 설정해야 한다', async () => {
      // Given
      const currentHash = await bcrypt.hash('current-password', 10);
      const mockUser = {
        id: 'user-1',
        passwordHash: currentHash,
        refreshTokenHash: 'some-hash',
      } as User;

      const command = new ChangePasswordCommand(
        'user-1',
        'current-password',
        'new-password',
      );
      mockUserService.ID로_사용자를_조회한다.mockResolvedValue(mockUser);
      mockUserService.사용자를_저장한다.mockResolvedValue(mockUser);

      // When
      await handler.execute(command);

      // Then
      expect(mockUser.refreshTokenHash).toBeNull();
      expect(
        await bcrypt.compare('new-password', mockUser.passwordHash),
      ).toBe(true);
      expect(userService.사용자를_저장한다).toHaveBeenCalledWith(mockUser);
    });

    it('현재 비밀번호가 틀리면 UnauthorizedException을 던져야 한다', async () => {
      // Given
      const currentHash = await bcrypt.hash('correct-password', 10);
      const mockUser = {
        id: 'user-1',
        passwordHash: currentHash,
      } as User;

      const command = new ChangePasswordCommand(
        'user-1',
        'wrong-password',
        'new-password',
      );
      mockUserService.ID로_사용자를_조회한다.mockResolvedValue(mockUser);

      // When & Then
      await expect(handler.execute(command)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('사용자가 없으면 UnauthorizedException을 던져야 한다', async () => {
      // Given
      const command = new ChangePasswordCommand(
        'not-exist',
        'password',
        'new-password',
      );
      mockUserService.ID로_사용자를_조회한다.mockResolvedValue(null);

      // When & Then
      await expect(handler.execute(command)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
