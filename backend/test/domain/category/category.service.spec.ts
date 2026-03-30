import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryService } from '@domain/category/category.service';
import { Category } from '@domain/category/category.entity';

describe('CategoryService', () => {
  let service: CategoryService;
  let repository: jest.Mocked<Repository<Category>>;

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
        CategoryService,
        {
          provide: getRepositoryToken(Category),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    repository = module.get(getRepositoryToken(Category));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('카테고리_목록을_조회한다', () => {
    it('거점의 카테고리 목록을 sortOrder 순으로 조회해야 한다', async () => {
      const mockCategories = [
        { id: '1', name: '식료품', sortOrder: 0 },
        { id: '2', name: '생활용품', sortOrder: 1 },
      ] as Category[];
      mockRepository.find.mockResolvedValue(mockCategories);

      const result = await service.카테고리_목록을_조회한다('household-1');

      expect(repository.find).toHaveBeenCalledWith({
        where: { householdId: 'household-1' },
        order: { sortOrder: 'ASC', createdAt: 'ASC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('카테고리를_생성한다', () => {
    it('카테고리를 생성하고 저장해야 한다', async () => {
      const data = { householdId: 'household-1', name: '식료품', sortOrder: 0 };
      const mockCategory = { id: 'cat-1', ...data } as Category;
      mockRepository.create.mockReturnValue(mockCategory);
      mockRepository.save.mockResolvedValue(mockCategory);

      const result = await service.카테고리를_생성한다(data);

      expect(repository.create).toHaveBeenCalledWith(data);
      expect(result).toEqual(mockCategory);
    });
  });

  describe('카테고리를_수정한다', () => {
    it('카테고리를 찾아서 수정해야 한다', async () => {
      const mockCategory = {
        id: 'cat-1',
        householdId: 'household-1',
        name: '식료품',
      } as Category;
      const updated = { ...mockCategory, name: '음식' } as Category;
      mockRepository.findOne.mockResolvedValue(mockCategory);
      mockRepository.save.mockResolvedValue(updated);

      const result = await service.카테고리를_수정한다('cat-1', 'household-1', {
        name: '음식',
      });

      expect(result?.name).toBe('음식');
    });

    it('존재하지 않으면 null을 반환해야 한다', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.카테고리를_수정한다(
        'not-exist',
        'household-1',
        { name: '음식' },
      );

      expect(result).toBeNull();
    });
  });

  describe('카테고리를_삭제한다', () => {
    it('삭제 성공 시 true를 반환해야 한다', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.카테고리를_삭제한다('cat-1', 'household-1');

      expect(result).toBe(true);
    });

    it('삭제할 카테고리가 없으면 false를 반환해야 한다', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });

      const result = await service.카테고리를_삭제한다(
        'not-exist',
        'household-1',
      );

      expect(result).toBe(false);
    });
  });

  describe('다른_거점에서_카테고리를_복사한다', () => {
    it('원본 거점의 카테고리를 대상 거점으로 복사해야 한다', async () => {
      const sourceCategories = [
        { id: 'src-1', name: '식료품', sortOrder: 0 },
        { id: 'src-2', name: '생활용품', sortOrder: 1 },
      ] as Category[];
      mockRepository.find.mockResolvedValue(sourceCategories);

      const copies = [
        { id: 'new-1', householdId: 'target', name: '식료품', sortOrder: 0 },
        { id: 'new-2', householdId: 'target', name: '생활용품', sortOrder: 1 },
      ] as Category[];
      mockRepository.create.mockImplementation(
        (data) => data as Category,
      );
      mockRepository.save.mockResolvedValue(copies);

      const result = await service.다른_거점에서_카테고리를_복사한다(
        'source',
        'target',
      );

      expect(repository.find).toHaveBeenCalledWith({
        where: { householdId: 'source' },
        order: { sortOrder: 'ASC', createdAt: 'ASC' },
      });
      expect(repository.create).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });
  });
});
