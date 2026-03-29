import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HouseholdMemberService } from '@domain/household/household-member.service';
import { HouseholdMember } from '@domain/household/household-member.entity';

describe('HouseholdMemberService', () => {
  let service: HouseholdMemberService;
  let memberRepository: jest.Mocked<Repository<HouseholdMember>>;

  const mockMemberRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HouseholdMemberService,
        {
          provide: getRepositoryToken(HouseholdMember),
          useValue: mockMemberRepository,
        },
      ],
    }).compile();

    service = module.get<HouseholdMemberService>(HouseholdMemberService);
    memberRepository = module.get(getRepositoryToken(HouseholdMember));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('멤버를_조회한다', () => {
    it('userId와 householdId로 멤버를 조회해야 한다', async () => {
      // Given
      const mockMember = {
        id: 'member-1',
        userId: 'user-1',
        householdId: 'household-1',
        role: 'admin',
      } as HouseholdMember;
      mockMemberRepository.findOne.mockResolvedValue(mockMember);

      // When
      const result = await service.멤버를_조회한다('user-1', 'household-1');

      // Then
      expect(memberRepository.findOne).toHaveBeenCalledWith({
        where: { userId: 'user-1', householdId: 'household-1' },
      });
      expect(result).toEqual(mockMember);
    });
  });

  describe('ID로_멤버를_조회한다', () => {
    it('ID로 멤버를 조회해야 한다', async () => {
      // Given
      const mockMember = {
        id: 'member-1',
        userId: 'user-1',
        householdId: 'household-1',
      } as HouseholdMember;
      mockMemberRepository.findOne.mockResolvedValue(mockMember);

      // When
      const result = await service.ID로_멤버를_조회한다('member-1');

      // Then
      expect(memberRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'member-1' },
      });
      expect(result).toEqual(mockMember);
    });
  });

  describe('거점의_멤버_목록을_조회한다', () => {
    it('거점의 멤버 목록을 user 관계와 함께 조회해야 한다', async () => {
      // Given
      const mockMembers = [
        { id: 'member-1', userId: 'user-1', householdId: 'household-1' },
        { id: 'member-2', userId: 'user-2', householdId: 'household-1' },
      ] as HouseholdMember[];
      mockMemberRepository.find.mockResolvedValue(mockMembers);

      // When
      const result =
        await service.거점의_멤버_목록을_조회한다('household-1');

      // Then
      expect(memberRepository.find).toHaveBeenCalledWith({
        where: { householdId: 'household-1' },
        relations: ['user'],
        order: { createdAt: 'ASC' },
      });
      expect(result).toEqual(mockMembers);
    });
  });

  describe('사용자의_거점_목록을_조회한다', () => {
    it('사용자의 거점 목록을 household 관계와 함께 조회해야 한다', async () => {
      // Given
      const mockMembers = [
        { id: 'member-1', userId: 'user-1', householdId: 'household-1' },
      ] as HouseholdMember[];
      mockMemberRepository.find.mockResolvedValue(mockMembers);

      // When
      const result = await service.사용자의_거점_목록을_조회한다('user-1');

      // Then
      expect(memberRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        relations: ['household'],
        order: { createdAt: 'ASC' },
      });
      expect(result).toEqual(mockMembers);
    });
  });

  describe('멤버를_추가한다', () => {
    it('멤버를 생성하고 저장해야 한다', async () => {
      // Given
      const createData = {
        userId: 'user-1',
        householdId: 'household-1',
        role: 'editor' as const,
      };
      const mockMember = { id: 'member-1', ...createData } as HouseholdMember;
      mockMemberRepository.create.mockReturnValue(mockMember);
      mockMemberRepository.save.mockResolvedValue(mockMember);

      // When
      const result = await service.멤버를_추가한다(createData);

      // Then
      expect(memberRepository.create).toHaveBeenCalledWith(createData);
      expect(memberRepository.save).toHaveBeenCalledWith(mockMember);
      expect(result).toEqual(mockMember);
    });
  });

  describe('멤버를_저장한다', () => {
    it('멤버를 저장해야 한다', async () => {
      // Given
      const mockMember = {
        id: 'member-1',
        userId: 'user-1',
        householdId: 'household-1',
        role: 'admin',
      } as HouseholdMember;
      mockMemberRepository.save.mockResolvedValue(mockMember);

      // When
      const result = await service.멤버를_저장한다(mockMember);

      // Then
      expect(memberRepository.save).toHaveBeenCalledWith(mockMember);
      expect(result).toEqual(mockMember);
    });
  });

  describe('멤버를_삭제한다', () => {
    it('삭제에 성공하면 true를 반환해야 한다', async () => {
      // Given
      mockMemberRepository.delete.mockResolvedValue({ affected: 1 });

      // When
      const result = await service.멤버를_삭제한다('member-1');

      // Then
      expect(memberRepository.delete).toHaveBeenCalledWith('member-1');
      expect(result).toBe(true);
    });

    it('삭제할 멤버가 없으면 false를 반환해야 한다', async () => {
      // Given
      mockMemberRepository.delete.mockResolvedValue({ affected: 0 });

      // When
      const result = await service.멤버를_삭제한다('not-exist');

      // Then
      expect(result).toBe(false);
    });
  });

  describe('거점의_admin_수를_조회한다', () => {
    it('거점의 admin 수를 조회해야 한다', async () => {
      // Given
      mockMemberRepository.count.mockResolvedValue(2);

      // When
      const result =
        await service.거점의_admin_수를_조회한다('household-1');

      // Then
      expect(memberRepository.count).toHaveBeenCalledWith({
        where: { householdId: 'household-1', role: 'admin' },
      });
      expect(result).toBe(2);
    });
  });
});
