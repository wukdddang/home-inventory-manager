import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpirationAlertRuleService } from '@domain/expiration-alert-rule/expiration-alert-rule.service';
import { ExpirationAlertRule } from '@domain/expiration-alert-rule/expiration-alert-rule.entity';

describe('ExpirationAlertRuleService', () => {
  let service: ExpirationAlertRuleService;
  let repository: jest.Mocked<Repository<ExpirationAlertRule>>;

  const mockRepository = { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn(), update: jest.fn(), delete: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExpirationAlertRuleService, { provide: getRepositoryToken(ExpirationAlertRule), useValue: mockRepository }],
    }).compile();
    service = module.get<ExpirationAlertRuleService>(ExpirationAlertRuleService);
    repository = module.get(getRepositoryToken(ExpirationAlertRule));
  });

  afterEach(() => jest.clearAllMocks());

  it('만료 알림 규칙 목록을 조회해야 한다', async () => {
    mockRepository.find.mockResolvedValue([{ id: '1' }] as any);
    const result = await service.만료_알림_규칙_목록을_조회한다('household-1');
    expect(repository.find).toHaveBeenCalledWith({ where: { householdId: 'household-1' }, relations: ['product'], order: { createdAt: 'ASC' } });
    expect(result).toHaveLength(1);
  });

  it('만료 알림 규칙을 저장해야 한다', async () => {
    const data = { productId: 'prod-1', daysBefore: 3 };
    const mockRule = { id: 'rule-1', ...data } as any;
    mockRepository.create.mockReturnValue(mockRule);
    mockRepository.save.mockResolvedValue(mockRule);
    const result = await service.만료_알림_규칙을_저장한다(data);
    expect(result).toEqual(mockRule);
  });

  it('만료 알림 규칙을 수정해야 한다', async () => {
    mockRepository.update.mockResolvedValue({ affected: 1 });
    mockRepository.findOne.mockResolvedValue({ id: 'rule-1', daysBefore: 5 } as any);
    const result = await service.만료_알림_규칙을_수정한다('rule-1', { daysBefore: 5 });
    expect(result?.daysBefore).toBe(5);
  });

  it('만료 알림 규칙을 삭제해야 한다', async () => {
    mockRepository.delete.mockResolvedValue({ affected: 1 });
    expect(await service.만료_알림_규칙을_삭제한다('rule-1')).toBe(true);
  });
});
