import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HouseholdInvitationService } from '@domain/household-invitation/household-invitation.service';
import { HouseholdInvitation } from '@domain/household-invitation/household-invitation.entity';

describe('HouseholdInvitationService', () => {
  let service: HouseholdInvitationService;
  let repository: jest.Mocked<Repository<HouseholdInvitation>>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HouseholdInvitationService,
        {
          provide: getRepositoryToken(HouseholdInvitation),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<HouseholdInvitationService>(
      HouseholdInvitationService,
    );
    repository = module.get(getRepositoryToken(HouseholdInvitation));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('초대를_생성한다', () => {
    it('초대를 생성하고 status를 pending으로 설정해야 한다', async () => {
      // Given
      const data = {
        householdId: 'household-1',
        invitedByUserId: 'user-1',
        role: 'editor' as const,
        token: 'abc123',
        inviteeEmail: null,
        expiresAt: new Date('2026-04-06'),
      };
      const mockInvitation = {
        id: 'inv-1',
        ...data,
        status: 'pending',
        acceptedByUserId: null,
        acceptedAt: null,
        createdAt: new Date(),
      } as HouseholdInvitation;

      mockRepository.create.mockReturnValue(mockInvitation);
      mockRepository.save.mockResolvedValue(mockInvitation);

      // When
      const result = await service.초대를_생성한다(data);

      // Then
      expect(repository.create).toHaveBeenCalledWith({
        ...data,
        status: 'pending',
      });
      expect(repository.save).toHaveBeenCalledWith(mockInvitation);
      expect(result.status).toBe('pending');
    });
  });

  describe('토큰으로_초대를_조회한다', () => {
    it('토큰으로 초대를 릴레이션 포함하여 조회해야 한다', async () => {
      // Given
      const mockInvitation = {
        id: 'inv-1',
        token: 'abc123',
      } as HouseholdInvitation;
      mockRepository.findOne.mockResolvedValue(mockInvitation);

      // When
      const result = await service.토큰으로_초대를_조회한다('abc123');

      // Then
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { token: 'abc123' },
        relations: ['household', 'invitedByUser'],
      });
      expect(result).toEqual(mockInvitation);
    });

    it('존재하지 않는 토큰이면 null을 반환해야 한다', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.토큰으로_초대를_조회한다('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('ID로_초대를_조회한다', () => {
    it('ID로 초대를 조회해야 한다', async () => {
      const mockInvitation = { id: 'inv-1' } as HouseholdInvitation;
      mockRepository.findOne.mockResolvedValue(mockInvitation);

      const result = await service.ID로_초대를_조회한다('inv-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
      });
      expect(result).toEqual(mockInvitation);
    });
  });

  describe('거점의_대기중_초대_목록을_조회한다', () => {
    it('pending 상태의 초대 목록을 조회해야 한다', async () => {
      const mockInvitations = [
        { id: 'inv-1', status: 'pending' },
        { id: 'inv-2', status: 'pending' },
      ] as HouseholdInvitation[];
      mockRepository.find.mockResolvedValue(mockInvitations);

      const result =
        await service.거점의_대기중_초대_목록을_조회한다('household-1');

      expect(repository.find).toHaveBeenCalledWith({
        where: { householdId: 'household-1', status: 'pending' },
        relations: ['invitedByUser'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('초대를_저장한다', () => {
    it('초대를 저장해야 한다', async () => {
      const mockInvitation = {
        id: 'inv-1',
        status: 'revoked',
      } as HouseholdInvitation;
      mockRepository.save.mockResolvedValue(mockInvitation);

      const result = await service.초대를_저장한다(mockInvitation);

      expect(repository.save).toHaveBeenCalledWith(mockInvitation);
      expect(result).toEqual(mockInvitation);
    });
  });

  describe('만료된_초대를_일괄_처리한다', () => {
    it('만료된 pending 초대를 expired로 변경해야 한다', async () => {
      const mockQB = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 3 }),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQB as any);

      const result = await service.만료된_초대를_일괄_처리한다();

      expect(result).toBe(3);
      expect(mockQB.set).toHaveBeenCalledWith({ status: 'expired' });
    });
  });
});
