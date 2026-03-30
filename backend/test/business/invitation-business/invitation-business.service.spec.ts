import { Test, TestingModule } from '@nestjs/testing';
import { InvitationBusinessService } from '@business/invitation-business/invitation-business.service';
import { InvitationContextService } from '@context/invitation-context/invitation-context.service';

describe('InvitationBusinessService', () => {
  let service: InvitationBusinessService;
  let contextService: jest.Mocked<InvitationContextService>;

  const mockContextService = {
    초대를_생성한다: jest.fn(),
    초대_목록을_조회한다: jest.fn(),
    토큰으로_초대를_조회한다: jest.fn(),
    초대를_취소한다: jest.fn(),
    초대를_수락한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationBusinessService,
        {
          provide: InvitationContextService,
          useValue: mockContextService,
        },
      ],
    }).compile();

    service = module.get<InvitationBusinessService>(InvitationBusinessService);
    contextService = module.get(InvitationContextService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('초대를_생성한다', () => {
    it('컨텍스트 서비스를 호출하여 초대를 생성해야 한다', async () => {
      const data = {
        householdId: 'household-1',
        invitedByUserId: 'user-1',
        role: 'editor' as const,
      };
      const mockResult = {
        id: 'inv-1',
        householdId: 'household-1',
        householdName: '우리집',
        invitedByUserId: 'user-1',
        invitedByDisplayName: '사용자1',
        role: 'editor',
        token: 'abc',
        status: 'pending',
        inviteeEmail: null,
        acceptedByUserId: null,
        acceptedAt: null,
        expiresAt: new Date(),
        createdAt: new Date(),
      };
      mockContextService.초대를_생성한다.mockResolvedValue(mockResult);

      const result = await service.초대를_생성한다(data);

      expect(contextService.초대를_생성한다).toHaveBeenCalledWith(data);
      expect(result).toEqual(mockResult);
    });
  });

  describe('초대_목록을_조회한다', () => {
    it('컨텍스트 서비스를 호출하여 초대 목록을 조회해야 한다', async () => {
      const mockResult = [{ id: 'inv-1' }];
      mockContextService.초대_목록을_조회한다.mockResolvedValue(
        mockResult as any,
      );

      const result = await service.초대_목록을_조회한다('household-1');

      expect(contextService.초대_목록을_조회한다).toHaveBeenCalledWith(
        'household-1',
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('토큰으로_초대를_조회한다', () => {
    it('컨텍스트 서비스를 호출하여 토큰으로 초대를 조회해야 한다', async () => {
      const mockResult = { id: 'inv-1', token: 'abc' };
      mockContextService.토큰으로_초대를_조회한다.mockResolvedValue(
        mockResult as any,
      );

      const result = await service.토큰으로_초대를_조회한다('abc');

      expect(contextService.토큰으로_초대를_조회한다).toHaveBeenCalledWith(
        'abc',
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('초대를_취소한다', () => {
    it('컨텍스트 서비스를 호출하여 초대를 취소해야 한다', async () => {
      mockContextService.초대를_취소한다.mockResolvedValue(undefined);

      await service.초대를_취소한다('inv-1', 'household-1');

      expect(contextService.초대를_취소한다).toHaveBeenCalledWith(
        'inv-1',
        'household-1',
      );
    });
  });

  describe('초대를_수락한다', () => {
    it('컨텍스트 서비스를 호출하여 초대를 수락해야 한다', async () => {
      mockContextService.초대를_수락한다.mockResolvedValue(undefined);

      await service.초대를_수락한다('token-1', 'user-2', 'user2@example.com');

      expect(contextService.초대를_수락한다).toHaveBeenCalledWith(
        'token-1',
        'user-2',
        'user2@example.com',
      );
    });
  });
});
