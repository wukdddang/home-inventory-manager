import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from '@domain/user/user.service';
import { User } from '@domain/user/user.entity';

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<Repository<User>>;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('이메일로_사용자를_조회한다', () => {
    it('이메일로 사용자를 조회해야 한다', async () => {
      // Given
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        displayName: '테스트 사용자',
      } as User;
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // When
      const result = await service.이메일로_사용자를_조회한다('test@example.com');

      // Then
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockUser);
    });

    it('존재하지 않는 이메일이면 null을 반환해야 한다', async () => {
      // Given
      mockUserRepository.findOne.mockResolvedValue(null);

      // When
      const result =
        await service.이메일로_사용자를_조회한다('notfound@example.com');

      // Then
      expect(result).toBeNull();
    });
  });

  describe('ID로_사용자를_조회한다', () => {
    it('ID로 사용자를 조회해야 한다', async () => {
      // Given
      const mockUser = { id: 'user-1', email: 'test@example.com' } as User;
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // When
      const result = await service.ID로_사용자를_조회한다('user-1');

      // Then
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(result).toEqual(mockUser);
    });

    it('존재하지 않는 ID이면 null을 반환해야 한다', async () => {
      // Given
      mockUserRepository.findOne.mockResolvedValue(null);

      // When
      const result = await service.ID로_사용자를_조회한다('not-exist');

      // Then
      expect(result).toBeNull();
    });
  });

  describe('인증토큰으로_사용자를_조회한다', () => {
    it('인증 토큰으로 사용자를 조회해야 한다', async () => {
      // Given
      const mockUser = {
        id: 'user-1',
        emailVerificationToken: 'token-123',
      } as User;
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // When
      const result =
        await service.인증토큰으로_사용자를_조회한다('token-123');

      // Then
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { emailVerificationToken: 'token-123' },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('사용자를_생성한다', () => {
    it('사용자를 생성해야 한다', async () => {
      // Given
      const createData = {
        email: 'new@example.com',
        passwordHash: 'hashed-password',
        displayName: '새 사용자',
        emailVerificationToken: 'token-123',
      };

      const mockUser = { id: 'user-1', ...createData } as User;
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      // When
      const result = await service.사용자를_생성한다(createData);

      // Then
      expect(userRepository.create).toHaveBeenCalledWith(createData);
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });
  });

  describe('사용자를_저장한다', () => {
    it('사용자를 저장해야 한다', async () => {
      // Given
      const mockUser = { id: 'user-1', email: 'test@example.com' } as User;
      mockUserRepository.save.mockResolvedValue(mockUser);

      // When
      const result = await service.사용자를_저장한다(mockUser);

      // Then
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });
  });
});
