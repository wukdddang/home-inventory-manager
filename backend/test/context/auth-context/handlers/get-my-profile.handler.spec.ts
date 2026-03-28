import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import {
  GetMyProfileHandler,
  GetMyProfileQuery,
} from '@context/auth-context/handlers/queries/get-my-profile.handler';
import { UserService } from '@domain/user/user.service';
import { User } from '@domain/user/user.entity';

describe('GetMyProfileHandler', () => {
  let handler: GetMyProfileHandler;
  let userService: jest.Mocked<UserService>;

  const mockUserService = {
    ID로_사용자를_조회한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetMyProfileHandler,
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    handler = module.get<GetMyProfileHandler>(GetMyProfileHandler);
    userService = module.get(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('사용자 프로필을 반환해야 한다', async () => {
      // Given
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        displayName: '테스트 사용자',
        emailVerifiedAt: null,
        lastLoginAt: new Date(),
        createdAt: new Date(),
      } as User;

      const query = new GetMyProfileQuery('user-1');
      mockUserService.ID로_사용자를_조회한다.mockResolvedValue(mockUser);

      // When
      const result = await handler.execute(query);

      // Then
      expect(result).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        displayName: '테스트 사용자',
        emailVerifiedAt: null,
        lastLoginAt: mockUser.lastLoginAt,
        createdAt: mockUser.createdAt,
      });
    });

    it('사용자가 없으면 NotFoundException을 던져야 한다', async () => {
      // Given
      const query = new GetMyProfileQuery('not-exist');
      mockUserService.ID로_사용자를_조회한다.mockResolvedValue(null);

      // When & Then
      await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
    });
  });
});
