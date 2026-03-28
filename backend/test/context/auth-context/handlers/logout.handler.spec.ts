import { Test, TestingModule } from '@nestjs/testing';
import {
  LogoutHandler,
  LogoutCommand,
} from '@context/auth-context/handlers/commands/logout.handler';
import { UserService } from '@domain/user/user.service';
import { User } from '@domain/user/user.entity';

describe('LogoutHandler', () => {
  let handler: LogoutHandler;
  let userService: jest.Mocked<UserService>;

  const mockUserService = {
    ID로_사용자를_조회한다: jest.fn(),
    사용자를_저장한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogoutHandler,
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    handler = module.get<LogoutHandler>(LogoutHandler);
    userService = module.get(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('refreshTokenHash를 null로 설정해야 한다', async () => {
      // Given
      const mockUser = {
        id: 'user-1',
        refreshTokenHash: 'some-hash',
      } as User;

      const command = new LogoutCommand('user-1');
      mockUserService.ID로_사용자를_조회한다.mockResolvedValue(mockUser);
      mockUserService.사용자를_저장한다.mockResolvedValue(mockUser);

      // When
      await handler.execute(command);

      // Then
      expect(mockUser.refreshTokenHash).toBeNull();
      expect(userService.사용자를_저장한다).toHaveBeenCalledWith(mockUser);
    });

    it('사용자가 없어도 에러를 던지지 않아야 한다', async () => {
      // Given
      const command = new LogoutCommand('not-exist');
      mockUserService.ID로_사용자를_조회한다.mockResolvedValue(null);

      // When & Then
      await expect(handler.execute(command)).resolves.not.toThrow();
    });
  });
});
