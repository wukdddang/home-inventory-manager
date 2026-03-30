import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  HouseholdKindDefinitionService,
  DEFAULT_KIND_DEFINITIONS,
} from '@domain/household-kind-definition/household-kind-definition.service';
import { HouseholdKindDefinition } from '@domain/household-kind-definition/household-kind-definition.entity';

describe('HouseholdKindDefinitionService', () => {
  let service: HouseholdKindDefinitionService;
  let repository: jest.Mocked<Repository<HouseholdKindDefinition>>;

  const mockRepository = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HouseholdKindDefinitionService,
        {
          provide: getRepositoryToken(HouseholdKindDefinition),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<HouseholdKindDefinitionService>(
      HouseholdKindDefinitionService,
    );
    repository = module.get(getRepositoryToken(HouseholdKindDefinition));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('사용자의_유형_목록을_조회한다', () => {
    it('사용자의 유형 목록을 sortOrder 순으로 조회해야 한다', async () => {
      const mockDefs = [
        { id: '1', kindId: 'home', label: '집', sortOrder: 0 },
        { id: '2', kindId: 'office', label: '사무실', sortOrder: 1 },
      ] as HouseholdKindDefinition[];
      mockRepository.find.mockResolvedValue(mockDefs);

      const result = await service.사용자의_유형_목록을_조회한다('user-1');

      expect(repository.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { sortOrder: 'ASC', createdAt: 'ASC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('기본_유형을_시드한다', () => {
    it('기본 4종을 생성하고 저장해야 한다', async () => {
      const mockCreated = DEFAULT_KIND_DEFINITIONS.map((def, i) => ({
        id: `def-${i}`,
        userId: 'user-1',
        ...def,
      })) as HouseholdKindDefinition[];

      mockRepository.create.mockImplementation(
        (data) => data as HouseholdKindDefinition,
      );
      mockRepository.save.mockResolvedValue(mockCreated);

      const result = await service.기본_유형을_시드한다('user-1');

      expect(repository.create).toHaveBeenCalledTimes(4);
      expect(repository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ kindId: 'home', label: '집' }),
          expect.objectContaining({ kindId: 'office', label: '사무실' }),
          expect.objectContaining({ kindId: 'vehicle', label: '차량' }),
          expect.objectContaining({ kindId: 'other', label: '기타' }),
        ]),
      );
      expect(result).toEqual(mockCreated);
    });
  });

  describe('유형_목록을_일괄_저장한다', () => {
    it('기존 목록을 삭제하고 새 목록을 저장해야 한다', async () => {
      const items = [
        { kindId: 'home', label: '우리집', sortOrder: 0 },
        { kindId: 'custom', label: '창고', sortOrder: 1 },
      ];
      const mockSaved = items.map((item, i) => ({
        id: `new-${i}`,
        userId: 'user-1',
        ...item,
      })) as HouseholdKindDefinition[];

      mockRepository.delete.mockResolvedValue({ affected: 4 });
      mockRepository.create.mockImplementation(
        (data) => data as HouseholdKindDefinition,
      );
      mockRepository.save.mockResolvedValue(mockSaved);

      const result = await service.유형_목록을_일괄_저장한다('user-1', items);

      expect(repository.delete).toHaveBeenCalledWith({ userId: 'user-1' });
      expect(repository.create).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockSaved);
    });
  });
});
