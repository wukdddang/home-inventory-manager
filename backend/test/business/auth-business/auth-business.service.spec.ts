import { Test, TestingModule } from '@nestjs/testing';
import { AuthBusinessService } from '@business/auth-business/auth-business.service';
import { AuthContextService } from '@context/auth-context/auth-context.service';

describe('AuthBusinessService', () => {
  let service: AuthBusinessService;
  let authContextService: jest.Mocked<AuthContextService>;

  const mockAuthContextService = {
    회원가입을_한다: jest.fn(),
    로그인을_한다: jest.fn(),
    토큰을_갱신한다: jest.fn(),
    로그아웃을_한다: jest.fn(),
    이메일_인증을_완료한다: jest.fn(),
    비밀번호를_변경한다: jest.fn(),
    내_정보를_조회한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthBusinessService,
        { provide: AuthContextService, useValue: mockAuthContextService },
      ],
    }).compile();

    service = module.get<AuthBusinessService>(AuthBusinessService);
    authContextService = module.get(AuthContextService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('회원가입을_한다', () => {
    it('컨텍스트 서비스를 호출하여 회원가입을 처리해야 한다', async () => {
      // Given
      const data = {
        email: 'test@example.com',
        password: 'password123',
        displayName: '테스트',
      };
      const mockResult = { accessToken: 'at', refreshToken: 'rt' };
      mockAuthContextService.회원가입을_한다.mockResolvedValue(mockResult);

      // When
      const result = await service.회원가입을_한다(data);

      // Then
      expect(authContextService.회원가입을_한다).toHaveBeenCalledWith(data);
      expect(result).toEqual(mockResult);
    });
  });

  describe('로그인을_한다', () => {
    it('컨텍스트 서비스를 호출하여 로그인을 처리해야 한다', async () => {
      // Given
      const data = { email: 'test@example.com', password: 'password123' };
      const mockResult = { accessToken: 'at', refreshToken: 'rt' };
      mockAuthContextService.로그인을_한다.mockResolvedValue(mockResult);

      // When
      const result = await service.로그인을_한다(data);

      // Then
      expect(authContextService.로그인을_한다).toHaveBeenCalledWith(data);
      expect(result).toEqual(mockResult);
    });
  });

  describe('토큰을_갱신한다', () => {
    it('컨텍스트 서비스를 호출하여 토큰을 갱신해야 한다', async () => {
      // Given
      const mockResult = { accessToken: 'new-at', refreshToken: 'new-rt' };
      mockAuthContextService.토큰을_갱신한다.mockResolvedValue(mockResult);

      // When
      const result = await service.토큰을_갱신한다('user-1', 'refresh-token');

      // Then
      expect(authContextService.토큰을_갱신한다).toHaveBeenCalledWith(
        'user-1',
        'refresh-token',
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('로그아웃을_한다', () => {
    it('컨텍스트 서비스를 호출하여 로그아웃을 처리해야 한다', async () => {
      // Given
      mockAuthContextService.로그아웃을_한다.mockResolvedValue(undefined);

      // When
      await service.로그아웃을_한다('user-1');

      // Then
      expect(authContextService.로그아웃을_한다).toHaveBeenCalledWith(
        'user-1',
      );
    });
  });

  describe('이메일_인증을_완료한다', () => {
    it('컨텍스트 서비스를 호출하여 이메일 인증을 처리해야 한다', async () => {
      // Given
      mockAuthContextService.이메일_인증을_완료한다.mockResolvedValue(
        undefined,
      );

      // When
      await service.이메일_인증을_완료한다('token-123');

      // Then
      expect(authContextService.이메일_인증을_완료한다).toHaveBeenCalledWith(
        'token-123',
      );
    });
  });

  describe('비밀번호를_변경한다', () => {
    it('컨텍스트 서비스를 호출하여 비밀번호를 변경해야 한다', async () => {
      // Given
      const data = {
        userId: 'user-1',
        currentPassword: 'old',
        newPassword: 'new',
      };
      mockAuthContextService.비밀번호를_변경한다.mockResolvedValue(undefined);

      // When
      await service.비밀번호를_변경한다(data);

      // Then
      expect(authContextService.비밀번호를_변경한다).toHaveBeenCalledWith(
        data,
      );
    });
  });

  describe('내_정보를_조회한다', () => {
    it('컨텍스트 서비스를 호출하여 프로필을 조회해야 한다', async () => {
      // Given
      const mockProfile = {
        id: 'user-1',
        email: 'test@example.com',
        displayName: '테스트',
        emailVerifiedAt: null,
        lastLoginAt: null,
        createdAt: new Date(),
      };
      mockAuthContextService.내_정보를_조회한다.mockResolvedValue(mockProfile);

      // When
      const result = await service.내_정보를_조회한다('user-1');

      // Then
      expect(authContextService.내_정보를_조회한다).toHaveBeenCalledWith(
        'user-1',
      );
      expect(result).toEqual(mockProfile);
    });
  });
});
