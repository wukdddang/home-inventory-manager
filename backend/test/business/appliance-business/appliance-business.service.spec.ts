import { Test, TestingModule } from '@nestjs/testing';
import { ApplianceBusinessService } from '@business/appliance-business/appliance-business.service';
import { ApplianceContextService } from '@context/appliance-context/appliance-context.service';

describe('ApplianceBusinessService', () => {
  let service: ApplianceBusinessService;
  let contextService: jest.Mocked<ApplianceContextService>;

  const mockContextService = {
    가전_목록을_조회한다: jest.fn(),
    가전을_단건_조회한다: jest.fn(),
    가전을_생성한다: jest.fn(),
    가전을_수정한다: jest.fn(),
    가전을_폐기한다: jest.fn(),
    유지보수_스케줄_목록을_조회한다: jest.fn(),
    유지보수_스케줄을_생성한다: jest.fn(),
    유지보수_스케줄을_수정한다: jest.fn(),
    유지보수_스케줄을_비활성화한다: jest.fn(),
    유지보수_이력_목록을_조회한다: jest.fn(),
    유지보수_이력을_생성한다: jest.fn(),
  };

  const mockAppliance = {
    id: 'app-1',
    householdId: 'hh-1',
    roomId: null,
    userId: 'user-1',
    name: '드럼세탁기',
    brand: 'LG',
    modelName: 'F21VDV',
    serialNumber: null,
    purchasedAt: '2024-01-15',
    purchasePrice: 1500000,
    warrantyExpiresAt: '2027-01-15',
    manualUrl: null,
    status: 'active' as const,
    memo: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplianceBusinessService,
        {
          provide: ApplianceContextService,
          useValue: mockContextService,
        },
      ],
    }).compile();

    service = module.get<ApplianceBusinessService>(ApplianceBusinessService);
    contextService = module.get(ApplianceContextService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── Appliance ──

  describe('가전을_생성한다', () => {
    it('컨텍스트 서비스를 호출하여 가전을 생성해야 한다', async () => {
      const data = {
        householdId: 'hh-1',
        userId: 'user-1',
        name: '드럼세탁기',
        brand: 'LG',
      };
      mockContextService.가전을_생성한다.mockResolvedValue(mockAppliance);

      const result = await service.가전을_생성한다(data);

      expect(contextService.가전을_생성한다).toHaveBeenCalledWith(data);
      expect(result).toEqual(mockAppliance);
    });
  });

  describe('가전_목록을_조회한다', () => {
    it('컨텍스트 서비스를 호출하여 가전 목록을 조회해야 한다', async () => {
      mockContextService.가전_목록을_조회한다.mockResolvedValue([mockAppliance]);

      const result = await service.가전_목록을_조회한다('hh-1');

      expect(contextService.가전_목록을_조회한다).toHaveBeenCalledWith(
        'hh-1',
        undefined,
      );
      expect(result).toEqual([mockAppliance]);
    });

    it('status 필터로 조회해야 한다', async () => {
      mockContextService.가전_목록을_조회한다.mockResolvedValue([]);

      await service.가전_목록을_조회한다('hh-1', 'retired');

      expect(contextService.가전_목록을_조회한다).toHaveBeenCalledWith(
        'hh-1',
        'retired',
      );
    });
  });

  describe('가전을_단건_조회한다', () => {
    it('컨텍스트 서비스를 호출하여 가전 상세를 조회해야 한다', async () => {
      mockContextService.가전을_단건_조회한다.mockResolvedValue(mockAppliance);

      const result = await service.가전을_단건_조회한다('app-1', 'hh-1');

      expect(contextService.가전을_단건_조회한다).toHaveBeenCalledWith(
        'app-1',
        'hh-1',
      );
      expect(result).toEqual(mockAppliance);
    });
  });

  describe('가전을_수정한다', () => {
    it('컨텍스트 서비스를 호출하여 가전을 수정해야 한다', async () => {
      const data = { name: '건조기' };
      const updated = { ...mockAppliance, name: '건조기' };
      mockContextService.가전을_수정한다.mockResolvedValue(updated);

      const result = await service.가전을_수정한다('app-1', 'hh-1', data);

      expect(contextService.가전을_수정한다).toHaveBeenCalledWith(
        'app-1',
        'hh-1',
        data,
      );
      expect(result.name).toBe('건조기');
    });
  });

  describe('가전을_폐기한다', () => {
    it('컨텍스트 서비스를 호출하여 가전을 폐기해야 한다', async () => {
      const retired = { ...mockAppliance, status: 'retired' as const };
      mockContextService.가전을_폐기한다.mockResolvedValue(retired);

      const result = await service.가전을_폐기한다('app-1', 'hh-1');

      expect(contextService.가전을_폐기한다).toHaveBeenCalledWith(
        'app-1',
        'hh-1',
      );
      expect(result.status).toBe('retired');
    });
  });

  // ── MaintenanceSchedule ──

  describe('유지보수_스케줄을_생성한다', () => {
    it('컨텍스트 서비스를 호출하여 스케줄을 생성해야 한다', async () => {
      const data = {
        applianceId: 'app-1',
        taskName: '필터 교체',
        recurrenceRule: { frequency: 'monthly' as const, interval: 3 },
        nextOccurrenceAt: '2026-07-01',
      };
      const mockSchedule = {
        id: 'sched-1',
        ...data,
        description: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockContextService.유지보수_스케줄을_생성한다.mockResolvedValue(
        mockSchedule,
      );

      const result = await service.유지보수_스케줄을_생성한다('hh-1', data);

      expect(contextService.유지보수_스케줄을_생성한다).toHaveBeenCalledWith(
        'hh-1',
        data,
      );
      expect(result.taskName).toBe('필터 교체');
    });
  });

  // ── MaintenanceLog ──

  describe('유지보수_이력을_생성한다', () => {
    it('컨텍스트 서비스를 호출하여 이력을 생성해야 한다', async () => {
      const data = {
        applianceId: 'app-1',
        type: 'repair' as const,
        description: '모터 교체',
        performedAt: '2026-04-01',
        cost: 150000,
      };
      const mockLog = {
        id: 'log-1',
        ...data,
        maintenanceScheduleId: null,
        householdMemberId: null,
        servicedBy: null,
        memo: null,
        createdAt: new Date(),
      };
      mockContextService.유지보수_이력을_생성한다.mockResolvedValue(mockLog);

      const result = await service.유지보수_이력을_생성한다('hh-1', data);

      expect(contextService.유지보수_이력을_생성한다).toHaveBeenCalledWith(
        'hh-1',
        data,
      );
      expect(result.description).toBe('모터 교체');
    });
  });
});
