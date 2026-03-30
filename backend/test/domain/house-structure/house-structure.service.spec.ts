import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HouseStructureService } from '@domain/house-structure/house-structure.service';
import { HouseStructure } from '@domain/house-structure/house-structure.entity';

describe('HouseStructureService', () => {
  let service: HouseStructureService;
  let repository: jest.Mocked<Repository<HouseStructure>>;

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HouseStructureService,
        {
          provide: getRepositoryToken(HouseStructure),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<HouseStructureService>(HouseStructureService);
    repository = module.get(getRepositoryToken(HouseStructure));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('거점의_집_구조를_조회한다', () => {
    it('householdId로 집 구조를 조회해야 한다', async () => {
      const mock = { id: 'hs-1', householdId: 'hh-1' } as unknown as HouseStructure;
      mockRepository.findOne.mockResolvedValue(mock);

      const result = await service.거점의_집_구조를_조회한다('hh-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { householdId: 'hh-1' },
      });
      expect(result).toEqual(mock);
    });

    it('없으면 null을 반환해야 한다', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.거점의_집_구조를_조회한다('hh-none');

      expect(result).toBeNull();
    });
  });

  describe('집_구조를_저장한다', () => {
    it('기존 구조가 없으면 새로 생성해야 한다', async () => {
      const data = {
        householdId: 'hh-1',
        name: '우리 집',
        structurePayload: { rooms: [] },
      };
      const mockCreated = { id: 'hs-1', ...data } as unknown as HouseStructure;

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockCreated);
      mockRepository.save.mockResolvedValue(mockCreated);

      const result = await service.집_구조를_저장한다(data);

      expect(repository.create).toHaveBeenCalledWith(data);
      expect(repository.save).toHaveBeenCalledWith(mockCreated);
      expect(result).toEqual(mockCreated);
    });

    it('기존 구조가 있으면 수정해야 한다', async () => {
      const existing = {
        id: 'hs-1',
        householdId: 'hh-1',
        name: '옛 이름',
        structurePayload: { rooms: [] },
      } as unknown as HouseStructure;

      const data = {
        householdId: 'hh-1',
        name: '새 이름',
        structurePayload: { rooms: [{ id: 'r1' }] },
      };

      mockRepository.findOne.mockResolvedValue(existing);
      mockRepository.save.mockResolvedValue({ ...existing, ...data } as HouseStructure);

      const result = await service.집_구조를_저장한다(data);

      expect(repository.create).not.toHaveBeenCalled();
      expect(result.name).toBe('새 이름');
    });
  });
});
