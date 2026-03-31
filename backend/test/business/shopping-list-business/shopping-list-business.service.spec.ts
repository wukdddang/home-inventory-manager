import { Test, TestingModule } from '@nestjs/testing';
import { ShoppingListBusinessService } from '@business/shopping-list-business/shopping-list-business.service';
import { ShoppingListContextService } from '@context/shopping-list-context/shopping-list-context.service';

describe('ShoppingListBusinessService', () => {
  let service: ShoppingListBusinessService;
  let contextService: jest.Mocked<ShoppingListContextService>;

  const mockContextService = {
    장보기_항목_목록을_조회한다: jest.fn(),
    장보기_항목을_추가한다: jest.fn(),
    장보기_항목을_수정한다: jest.fn(),
    장보기_항목을_삭제한다: jest.fn(),
    장보기_항목을_구매_완료_처리한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShoppingListBusinessService,
        { provide: ShoppingListContextService, useValue: mockContextService },
      ],
    }).compile();

    service = module.get<ShoppingListBusinessService>(ShoppingListBusinessService);
    contextService = module.get(ShoppingListContextService);
  });

  afterEach(() => jest.clearAllMocks());

  it('장보기 항목 목록을 조회해야 한다', async () => {
    mockContextService.장보기_항목_목록을_조회한다.mockResolvedValue([{ id: '1' }] as any);
    const result = await service.장보기_항목_목록을_조회한다('household-1');
    expect(contextService.장보기_항목_목록을_조회한다).toHaveBeenCalledWith('household-1');
    expect(result).toHaveLength(1);
  });

  it('장보기 항목을 추가해야 한다', async () => {
    const data = { householdId: 'household-1', memo: '우유' } as any;
    mockContextService.장보기_항목을_추가한다.mockResolvedValue({ id: '1', ...data } as any);
    const result = await service.장보기_항목을_추가한다(data);
    expect(contextService.장보기_항목을_추가한다).toHaveBeenCalledWith(data);
    expect(result).toBeDefined();
  });

  it('장보기 항목을 구매 완료 처리해야 한다', async () => {
    mockContextService.장보기_항목을_구매_완료_처리한다.mockResolvedValue({
      inventoryItem: { id: 'item-1', quantity: 15 },
      inventoryLog: { id: 'log-1', type: 'in', quantityDelta: 5, quantityAfter: 15 },
    });

    const result = await service.장보기_항목을_구매_완료_처리한다(
      'shopping-1', 'household-1', 'item-1', 5, null, 'user-1',
    );

    expect(contextService.장보기_항목을_구매_완료_처리한다).toHaveBeenCalledWith(
      'shopping-1', 'household-1', 'item-1', 5, null, 'user-1',
    );
    expect(result.inventoryItem.quantity).toBe(15);
  });
});
