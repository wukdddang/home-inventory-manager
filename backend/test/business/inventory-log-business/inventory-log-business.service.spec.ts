import { Test, TestingModule } from '@nestjs/testing';
import { InventoryLogBusinessService } from '@business/inventory-log-business/inventory-log-business.service';
import { InventoryLogContextService } from '@context/inventory-log-context/inventory-log-context.service';

describe('InventoryLogBusinessService', () => {
  let service: InventoryLogBusinessService;
  let contextService: jest.Mocked<InventoryLogContextService>;

  const mockContextService = {
    재고_변경_이력을_조회한다: jest.fn(),
    소비를_등록한다: jest.fn(),
    폐기를_등록한다: jest.fn(),
    수량을_수동_조정한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryLogBusinessService,
        {
          provide: InventoryLogContextService,
          useValue: mockContextService,
        },
      ],
    }).compile();

    service = module.get<InventoryLogBusinessService>(
      InventoryLogBusinessService,
    );
    contextService = module.get(InventoryLogContextService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('재고_변경_이력을_조회한다', () => {
    it('컨텍스트 서비스를 호출해야 한다', async () => {
      const mockResult = [{ id: 'log-1' }];
      mockContextService.재고_변경_이력을_조회한다.mockResolvedValue(
        mockResult as any,
      );

      const result = await service.재고_변경_이력을_조회한다('item-1');

      expect(contextService.재고_변경_이력을_조회한다).toHaveBeenCalledWith(
        'item-1',
        undefined,
        undefined,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('소비를_등록한다', () => {
    it('컨텍스트 서비스를 호출해야 한다', async () => {
      const mockResult = { id: 'log-1', type: 'out' };
      mockContextService.소비를_등록한다.mockResolvedValue(mockResult as any);

      const result = await service.소비를_등록한다('item-1', 3, 'user-1', null);

      expect(contextService.소비를_등록한다).toHaveBeenCalledWith(
        'item-1',
        3,
        'user-1',
        null,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('폐기를_등록한다', () => {
    it('컨텍스트 서비스를 호출해야 한다', async () => {
      const mockResult = { id: 'log-1', type: 'waste' };
      mockContextService.폐기를_등록한다.mockResolvedValue(mockResult as any);

      const result = await service.폐기를_등록한다(
        'item-1',
        2,
        '유통기한 만료',
        'user-1',
        null,
      );

      expect(contextService.폐기를_등록한다).toHaveBeenCalledWith(
        'item-1',
        2,
        '유통기한 만료',
        'user-1',
        null,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('수량을_수동_조정한다', () => {
    it('컨텍스트 서비스를 호출해야 한다', async () => {
      const mockResult = { id: 'log-1', type: 'adjust' };
      mockContextService.수량을_수동_조정한다.mockResolvedValue(
        mockResult as any,
      );

      const result = await service.수량을_수동_조정한다(
        'item-1',
        5,
        'user-1',
        '실사 보정',
      );

      expect(contextService.수량을_수동_조정한다).toHaveBeenCalledWith(
        'item-1',
        5,
        'user-1',
        '실사 보정',
      );
      expect(result).toEqual(mockResult);
    });
  });
});
