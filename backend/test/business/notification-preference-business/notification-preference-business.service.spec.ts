import { Test, TestingModule } from '@nestjs/testing';
import { NotificationPreferenceBusinessService } from '@business/notification-preference-business/notification-preference-business.service';
import { NotificationPreferenceContextService } from '@context/notification-preference-context/notification-preference-context.service';

describe('NotificationPreferenceBusinessService', () => {
  let service: NotificationPreferenceBusinessService;
  let contextService: jest.Mocked<NotificationPreferenceContextService>;

  const mockContextService = {
    알림_설정_목록을_조회한다: jest.fn(),
    알림_설정을_저장한다: jest.fn(),
    알림_설정을_수정한다: jest.fn(),
    알림_설정을_삭제한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationPreferenceBusinessService,
        { provide: NotificationPreferenceContextService, useValue: mockContextService },
      ],
    }).compile();

    service = module.get<NotificationPreferenceBusinessService>(NotificationPreferenceBusinessService);
    contextService = module.get(NotificationPreferenceContextService);
  });

  afterEach(() => jest.clearAllMocks());

  it('알림 설정 목록을 조회해야 한다', async () => {
    mockContextService.알림_설정_목록을_조회한다.mockResolvedValue([{ id: '1' }] as any);
    const result = await service.알림_설정_목록을_조회한다('user-1');
    expect(contextService.알림_설정_목록을_조회한다).toHaveBeenCalledWith('user-1');
    expect(result).toHaveLength(1);
  });

  it('알림 설정을 저장해야 한다', async () => {
    const data = { userId: 'user-1', notifyExpiration: true } as any;
    mockContextService.알림_설정을_저장한다.mockResolvedValue({ id: '1', ...data } as any);
    const result = await service.알림_설정을_저장한다(data);
    expect(contextService.알림_설정을_저장한다).toHaveBeenCalledWith(data);
    expect(result).toBeDefined();
  });

  it('알림 설정을 수정해야 한다', async () => {
    mockContextService.알림_설정을_수정한다.mockResolvedValue({ id: '1', notifyExpiration: false } as any);
    const result = await service.알림_설정을_수정한다('1', 'user-1', { notifyExpiration: false });
    expect(contextService.알림_설정을_수정한다).toHaveBeenCalledWith('1', 'user-1', { notifyExpiration: false });
    expect(result).toBeDefined();
  });

  it('알림 설정을 삭제해야 한다', async () => {
    mockContextService.알림_설정을_삭제한다.mockResolvedValue(undefined);
    await service.알림_설정을_삭제한다('1', 'user-1');
    expect(contextService.알림_설정을_삭제한다).toHaveBeenCalledWith('1', 'user-1');
  });
});
