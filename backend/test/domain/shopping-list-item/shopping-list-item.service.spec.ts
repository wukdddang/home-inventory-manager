import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShoppingListItemService } from '@domain/shopping-list-item/shopping-list-item.service';
import { ShoppingListItem } from '@domain/shopping-list-item/shopping-list-item.entity';

describe('ShoppingListItemService', () => {
  let service: ShoppingListItemService;
  let repository: jest.Mocked<Repository<ShoppingListItem>>;

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
        ShoppingListItemService,
        { provide: getRepositoryToken(ShoppingListItem), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<ShoppingListItemService>(ShoppingListItemService);
    repository = module.get(getRepositoryToken(ShoppingListItem));
  });

  afterEach(() => jest.clearAllMocks());

  describe('장보기_항목_목록을_조회한다', () => {
    it('거점의 장보기 항목 목록을 조회해야 한다', async () => {
      const mockItems = [{ id: '1' }, { id: '2' }] as ShoppingListItem[];
      mockRepository.find.mockResolvedValue(mockItems);

      const result = await service.장보기_항목_목록을_조회한다('household-1');

      expect(repository.find).toHaveBeenCalledWith({
        where: { householdId: 'household-1' },
        relations: ['category', 'product', 'productVariant'],
        order: { sortOrder: 'ASC', createdAt: 'ASC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('장보기_항목을_추가한다', () => {
    it('장보기 항목을 생성해야 한다', async () => {
      const data = { householdId: 'household-1', memo: '우유 2개' };
      const mockItem = { id: 'item-1', ...data } as ShoppingListItem;
      mockRepository.create.mockReturnValue(mockItem);
      mockRepository.save.mockResolvedValue(mockItem);

      const result = await service.장보기_항목을_추가한다(data);

      expect(repository.create).toHaveBeenCalledWith(data);
      expect(result).toEqual(mockItem);
    });
  });

  describe('장보기_항목을_수정한다', () => {
    it('항목을 찾아서 수정해야 한다', async () => {
      const mockItem = { id: 'item-1', householdId: 'household-1', memo: '우유' } as ShoppingListItem;
      const updated = { ...mockItem, memo: '우유 3개' } as ShoppingListItem;
      mockRepository.findOne.mockResolvedValue(mockItem);
      mockRepository.save.mockResolvedValue(updated);

      const result = await service.장보기_항목을_수정한다('item-1', 'household-1', { memo: '우유 3개' });

      expect(result?.memo).toBe('우유 3개');
    });

    it('존재하지 않으면 null을 반환해야 한다', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.장보기_항목을_수정한다('not-exist', 'household-1', { memo: 'x' });

      expect(result).toBeNull();
    });
  });

  describe('장보기_항목을_삭제한다', () => {
    it('삭제 성공 시 true를 반환해야 한다', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });
      expect(await service.장보기_항목을_삭제한다('item-1', 'household-1')).toBe(true);
    });

    it('삭제할 항목이 없으면 false를 반환해야 한다', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });
      expect(await service.장보기_항목을_삭제한다('not-exist', 'household-1')).toBe(false);
    });
  });
});
