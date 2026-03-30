import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FurniturePlacementService } from '@domain/furniture-placement/furniture-placement.service';
import { FurniturePlacement } from '@domain/furniture-placement/furniture-placement.entity';

describe('FurniturePlacementService', () => {
  let service: FurniturePlacementService;
  let repository: jest.Mocked<Repository<FurniturePlacement>>;

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
        FurniturePlacementService,
        {
          provide: getRepositoryToken(FurniturePlacement),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<FurniturePlacementService>(FurniturePlacementService);
    repository = module.get(getRepositoryToken(FurniturePlacement));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('방의_가구_목록을_조회한다', () => {
    it('roomId로 가구 목록을 조회해야 한다', async () => {
      const mockFurniture = [
        { id: 'f-1', label: '책상', sortOrder: 0 },
      ] as FurniturePlacement[];
      mockRepository.find.mockResolvedValue(mockFurniture);

      const result = await service.방의_가구_목록을_조회한다('room-1');

      expect(repository.find).toHaveBeenCalledWith({
        where: { roomId: 'room-1' },
        order: { sortOrder: 'ASC', createdAt: 'ASC' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('가구를_생성한다', () => {
    it('가구를 생성하고 저장해야 한다', async () => {
      const data = { roomId: 'room-1', label: '책상' };
      const mock = { id: 'f-1', ...data } as FurniturePlacement;
      mockRepository.create.mockReturnValue(mock);
      mockRepository.save.mockResolvedValue(mock);

      const result = await service.가구를_생성한다(data);

      expect(repository.create).toHaveBeenCalledWith(data);
      expect(result).toEqual(mock);
    });
  });

  describe('가구를_수정한다', () => {
    it('가구를 찾아서 수정해야 한다', async () => {
      const existing = { id: 'f-1', label: '책상' } as FurniturePlacement;
      const updated = { ...existing, label: '큰 책상' } as FurniturePlacement;
      mockRepository.findOne.mockResolvedValue(existing);
      mockRepository.save.mockResolvedValue(updated);

      const result = await service.가구를_수정한다('f-1', { label: '큰 책상' });

      expect(result?.label).toBe('큰 책상');
    });

    it('존재하지 않으면 null을 반환해야 한다', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.가구를_수정한다('none', { label: 'x' });

      expect(result).toBeNull();
    });
  });

  describe('가구를_삭제한다', () => {
    it('삭제 성공 시 true를 반환해야 한다', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.가구를_삭제한다('f-1');

      expect(result).toBe(true);
    });

    it('삭제할 가구가 없으면 false를 반환해야 한다', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });

      const result = await service.가구를_삭제한다('none');

      expect(result).toBe(false);
    });
  });
});
