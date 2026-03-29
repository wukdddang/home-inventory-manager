import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HouseholdService } from '@domain/household/household.service';
import { Household } from '@domain/household/household.entity';

describe('HouseholdService', () => {
  let service: HouseholdService;
  let householdRepository: jest.Mocked<Repository<Household>>;

  const mockHouseholdRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HouseholdService,
        {
          provide: getRepositoryToken(Household),
          useValue: mockHouseholdRepository,
        },
      ],
    }).compile();

    service = module.get<HouseholdService>(HouseholdService);
    householdRepository = module.get(getRepositoryToken(Household));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('거점을_생성한다', () => {
    it('거점을 생성하고 저장해야 한다', async () => {
      // Given
      const createData = { name: '우리집', kind: 'house' };
      const mockHousehold = {
        id: 'household-1',
        ...createData,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Household;
      mockHouseholdRepository.create.mockReturnValue(mockHousehold);
      mockHouseholdRepository.save.mockResolvedValue(mockHousehold);

      // When
      const result = await service.거점을_생성한다(createData);

      // Then
      expect(householdRepository.create).toHaveBeenCalledWith(createData);
      expect(householdRepository.save).toHaveBeenCalledWith(mockHousehold);
      expect(result).toEqual(mockHousehold);
    });
  });

  describe('ID로_거점을_조회한다', () => {
    it('ID로 거점을 조회해야 한다', async () => {
      // Given
      const mockHousehold = {
        id: 'household-1',
        name: '우리집',
        kind: 'house',
      } as Household;
      mockHouseholdRepository.findOne.mockResolvedValue(mockHousehold);

      // When
      const result = await service.ID로_거점을_조회한다('household-1');

      // Then
      expect(householdRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'household-1' },
      });
      expect(result).toEqual(mockHousehold);
    });

    it('존재하지 않는 ID이면 null을 반환해야 한다', async () => {
      // Given
      mockHouseholdRepository.findOne.mockResolvedValue(null);

      // When
      const result = await service.ID로_거점을_조회한다('not-exist');

      // Then
      expect(result).toBeNull();
    });
  });

  describe('거점을_수정한다', () => {
    it('거점을 찾아서 수정해야 한다', async () => {
      // Given
      const mockHousehold = {
        id: 'household-1',
        name: '우리집',
        kind: 'house',
      } as Household;
      const updateData = { name: '새 이름' };
      const updatedHousehold = { ...mockHousehold, ...updateData } as Household;

      mockHouseholdRepository.findOne.mockResolvedValue(mockHousehold);
      mockHouseholdRepository.save.mockResolvedValue(updatedHousehold);

      // When
      const result = await service.거점을_수정한다('household-1', updateData);

      // Then
      expect(householdRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'household-1' },
      });
      expect(householdRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedHousehold);
    });

    it('존재하지 않는 거점이면 null을 반환해야 한다', async () => {
      // Given
      mockHouseholdRepository.findOne.mockResolvedValue(null);

      // When
      const result = await service.거점을_수정한다('not-exist', {
        name: '새 이름',
      });

      // Then
      expect(result).toBeNull();
    });
  });

  describe('거점을_삭제한다', () => {
    it('삭제에 성공하면 true를 반환해야 한다', async () => {
      // Given
      mockHouseholdRepository.delete.mockResolvedValue({ affected: 1 });

      // When
      const result = await service.거점을_삭제한다('household-1');

      // Then
      expect(householdRepository.delete).toHaveBeenCalledWith('household-1');
      expect(result).toBe(true);
    });

    it('삭제할 거점이 없으면 false를 반환해야 한다', async () => {
      // Given
      mockHouseholdRepository.delete.mockResolvedValue({ affected: 0 });

      // When
      const result = await service.거점을_삭제한다('not-exist');

      // Then
      expect(result).toBe(false);
    });
  });
});
