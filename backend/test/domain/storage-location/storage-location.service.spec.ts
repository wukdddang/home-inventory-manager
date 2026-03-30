import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorageLocationService } from '@domain/storage-location/storage-location.service';
import { StorageLocation } from '@domain/storage-location/storage-location.entity';

describe('StorageLocationService', () => {
  let service: StorageLocationService;
  let repository: jest.Mocked<Repository<StorageLocation>>;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageLocationService,
        {
          provide: getRepositoryToken(StorageLocation),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<StorageLocationService>(StorageLocationService);
    repository = module.get(getRepositoryToken(StorageLocation));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('거점의_보관장소_목록을_조회한다', () => {
    it('householdId로 보관장소 목록을 릴레이션 포함하여 조회해야 한다', async () => {
      const mock = [
        { id: 'sl-1', name: '냉장고 문쪽' },
      ] as StorageLocation[];
      mockRepository.find.mockResolvedValue(mock);

      const result = await service.거점의_보관장소_목록을_조회한다('hh-1');

      expect(repository.find).toHaveBeenCalledWith({
        where: { householdId: 'hh-1' },
        relations: ['room', 'furniturePlacement'],
        order: { sortOrder: 'ASC', createdAt: 'ASC' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('보관장소를_생성한다', () => {
    it('보관장소를 생성하고 저장해야 한다', async () => {
      const data = { householdId: 'hh-1', name: '선반' };
      const mock = { id: 'sl-1', ...data } as StorageLocation;
      mockRepository.create.mockReturnValue(mock);
      mockRepository.save.mockResolvedValue(mock);

      const result = await service.보관장소를_생성한다(data);

      expect(repository.create).toHaveBeenCalledWith(data);
      expect(result).toEqual(mock);
    });
  });

  describe('보관장소를_수정한다', () => {
    it('보관장소를 찾아서 수정해야 한다', async () => {
      const existing = {
        id: 'sl-1',
        householdId: 'hh-1',
        name: '선반',
      } as StorageLocation;
      const updated = { ...existing, name: '선반 2단' } as StorageLocation;
      mockRepository.findOne.mockResolvedValue(existing);
      mockRepository.save.mockResolvedValue(updated);

      const result = await service.보관장소를_수정한다('sl-1', 'hh-1', {
        name: '선반 2단',
      });

      expect(result?.name).toBe('선반 2단');
    });

    it('존재하지 않으면 null을 반환해야 한다', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.보관장소를_수정한다('none', 'hh-1', {
        name: 'x',
      });

      expect(result).toBeNull();
    });
  });

  describe('보관장소를_삭제한다', () => {
    it('삭제 성공 시 true를 반환해야 한다', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.보관장소를_삭제한다('sl-1', 'hh-1');

      expect(result).toBe(true);
    });

    it('삭제할 보관장소가 없으면 false를 반환해야 한다', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });

      const result = await service.보관장소를_삭제한다('none', 'hh-1');

      expect(result).toBe(false);
    });
  });
});
